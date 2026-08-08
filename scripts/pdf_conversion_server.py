#!/usr/bin/env python3
"""
Self-hosted PDF -> Word / PDF -> Excel conversion service — a no-credentials
alternative to the Adobe PDF Services provider (see
lib/pdf-conversion/self-hosted-provider.ts, selected via
PDF_CONVERSION_PROVIDER=self-hosted). Everything runs on this VPS, so
there's no external API, no signup, and no per-conversion cost.

PDF -> DOCX uses pdf2docx, which reconstructs real paragraphs, basic
tables, and images rather than a flat text dump.

PDF -> XLSX uses pdfplumber's table detection to rebuild actual rows and
columns per page (one worksheet per detected table). If no table is
detected anywhere in the document, it falls back to one line of text per
row — the same floor the old client-side conversion had — rather than
producing an empty workbook. Each detected cell is also matched back to
its bounding box in the source PDF so real formatting carries over: bold
header text, numbers as actual numeric cells (currency/percent/plain,
right-aligned, with a matching number format instead of a `$` prefix
baked into a string), gridlines, and auto-sized columns.

Run under the dedicated venv at /opt/pdfgenie-ml/venv (see whisper_server.py
for the sibling self-hosted service this matches).
"""
import os
import re
import tempfile

from flask import Flask, Response, jsonify, request
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from pdf2docx import Converter
from pypdf import PdfReader, PdfWriter
import pdfplumber

PORT = int(os.environ.get("PDF_CONVERSION_PORT", "5007"))
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


def _save_upload(pdf_file) -> str:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        pdf_file.save(tmp.name)
        return tmp.name


def _decrypt_if_needed(input_path: str, password: str | None) -> tuple[str | None, tuple[str, int] | None]:
    """Returns (path_to_use, None) on success, or (None, (error_key, status)) on failure. path_to_use may be a new decrypted file, or the original path if the PDF wasn't encrypted."""
    reader = PdfReader(input_path)
    if not reader.is_encrypted:
        return input_path, None
    if not password:
        return None, ("password_required", 423)
    if reader.decrypt(password) == 0:
        return None, ("incorrect_password", 401)

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    decrypted_path = input_path + ".decrypted.pdf"
    with open(decrypted_path, "wb") as f:
        writer.write(f)
    return decrypted_path, None


def _looks_like_a_real_table(table) -> bool:
    if not table or len(table) < 2:
        return False
    if not any(len(row) >= 2 for row in table):
        return False
    non_empty_cells = sum(1 for row in table for cell in row if cell and str(cell).strip())
    return non_empty_cells >= 4


def _find_tables_multi_strategy(page):
    """pdfplumber's default ("lines") strategy only finds tables with actual
    drawn ruling — most real-world documents (invoices, exports, reports)
    align columns with whitespace instead, so this also tries a "text"
    (alignment-based) pass when the ruled-line pass finds nothing usable.
    Returns Table objects (not just their extracted grids) so each cell's
    bounding box is available for formatting lookups."""
    tables = [t for t in page.find_tables() if _looks_like_a_real_table(t.extract())]
    if tables:
        return tables

    text_settings = {"vertical_strategy": "text", "horizontal_strategy": "text"}
    tables = [t for t in page.find_tables(text_settings) if _looks_like_a_real_table(t.extract())]
    return tables


_THIN_SIDE = Side(style="thin", color="D6D9E0")
_CELL_BORDER = Border(left=_THIN_SIDE, right=_THIN_SIDE, top=_THIN_SIDE, bottom=_THIN_SIDE)
_HEADER_FILL = PatternFill(start_color="E7EAF3", end_color="E7EAF3", fill_type="solid")
_NUMERIC_RE = re.compile(r"^\(?-?\$?\s*\d[\d,]*(\.\d+)?%?\)?$")


def _cell_chars(page_chars, bbox):
    """Characters from the page whose center point falls inside a cell's bounding box."""
    if not bbox:
        return []
    x0, top, x1, bottom = bbox
    out = []
    for c in page_chars:
        cx = (c["x0"] + c["x1"]) / 2
        cy = (c["top"] + c["bottom"]) / 2
        if x0 - 1 <= cx <= x1 + 1 and top - 1 <= cy <= bottom + 1:
            out.append(c)
    return out


def _is_bold(chars) -> bool:
    if not chars:
        return False
    bold_count = sum(1 for c in chars if "bold" in (c.get("fontname") or "").lower())
    return bold_count > len(chars) / 2


def _parse_numeric_cell(text: str):
    """Recognizes plain/currency/percent numbers (incl. parenthesized negatives
    like accounting notation) and returns (value, is_currency, is_percent), or
    None if the text isn't a single number. Codes with a leading zero (invoice
    numbers, zip codes, IDs) are deliberately left as text — converting "007"
    to 7 would silently change what the cell displays."""
    t = text.strip()
    if not t or not _NUMERIC_RE.match(t):
        return None
    is_percent = t.endswith("%")
    is_currency = "$" in t
    negative = t.startswith("-") or (t.startswith("(") and t.endswith(")"))
    cleaned = t.strip("()").replace("$", "").replace("%", "").replace(",", "").lstrip("-")
    if not cleaned:
        return None
    int_part = cleaned.split(".")[0]
    if len(int_part) > 1 and int_part[0] == "0" and not is_currency and not is_percent:
        return None
    try:
        value = float(cleaned)
    except ValueError:
        return None
    if negative:
        value = -value
    if is_percent:
        value /= 100
    return value, is_currency, is_percent


def _style_and_write_table(ws, page, table):
    """Writes one detected table into a worksheet, matching the source PDF's
    formatting as closely as a flat grid of cells allows: the first row is
    treated as a header (bold, shaded, centered); numbers become real numeric
    cells with a matching format instead of formatted strings; any other cell
    the PDF itself rendered in a bold font keeps that weight; every cell gets
    a light grid border; and columns are auto-sized to their content."""
    data = table.extract()
    page_chars = page.chars
    col_widths: dict[int, float] = {}
    out_row = 0

    for row_text, row_obj in zip(data, table.rows):
        if not any(cell and str(cell).strip() for cell in row_text):
            continue  # the "text" strategy can emit spurious blank rows between real ones
        out_row += 1
        is_header = out_row == 1

        for col_index, raw in enumerate(row_text):
            value = "" if raw is None else str(raw).strip()
            bbox = row_obj.cells[col_index] if col_index < len(row_obj.cells) else None
            bold = is_header or _is_bold(_cell_chars(page_chars, bbox))

            cell = ws.cell(row=out_row, column=col_index + 1)
            numeric = None if is_header else _parse_numeric_cell(value)
            if numeric is not None:
                num_value, is_currency, is_percent = numeric
                cell.value = num_value
                if is_percent:
                    cell.number_format = "0.00%"
                elif is_currency:
                    cell.number_format = '"$"#,##0.00'
                elif num_value == int(num_value):
                    cell.number_format = "#,##0"
                else:
                    cell.number_format = "#,##0.00"
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.value = value
                cell.alignment = Alignment(
                    horizontal="center" if is_header else "left",
                    vertical="center",
                    wrap_text=is_header or len(value) > 40,
                )

            cell.font = Font(bold=bold)
            cell.border = _CELL_BORDER
            if is_header:
                cell.fill = _HEADER_FILL

            col_widths[col_index] = max(col_widths.get(col_index, 8.0), min(len(value) + 3, 60))

    for col_index, width in col_widths.items():
        ws.column_dimensions[get_column_letter(col_index + 1)].width = width
    if out_row > 1:
        ws.freeze_panes = "A2"


@app.post("/convert-to-docx")
def convert_to_docx():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    input_path = _save_upload(request.files["file"])
    password = request.form.get("password") or None
    cleanup_paths = [input_path]

    try:
        source_path, error = _decrypt_if_needed(input_path, password)
        if error:
            return jsonify({"error": error[0]}), error[1]
        if source_path != input_path:
            cleanup_paths.append(source_path)

        docx_path = input_path + ".out.docx"
        cleanup_paths.append(docx_path)

        cv = Converter(source_path)
        try:
            cv.convert(docx_path)
        finally:
            cv.close()

        with open(docx_path, "rb") as f:
            data = f.read()
        return Response(data, mimetype=DOCX_MIME)
    except Exception as exc:  # noqa: BLE001 — surfaced to the caller, not swallowed
        return jsonify({"error": str(exc)}), 500
    finally:
        for path in cleanup_paths:
            if path and os.path.exists(path):
                os.unlink(path)


@app.post("/convert-to-xlsx")
def convert_to_xlsx():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    input_path = _save_upload(request.files["file"])
    password = request.form.get("password") or None
    cleanup_paths = [input_path]

    try:
        source_path, error = _decrypt_if_needed(input_path, password)
        if error:
            return jsonify({"error": error[0]}), error[1]
        if source_path != input_path:
            cleanup_paths.append(source_path)

        wb = Workbook()
        wb.remove(wb.active)
        sheet_count = 0
        used_names = set()

        def add_sheet(name: str):
            base = name[:31] or "Sheet"
            candidate = base
            i = 2
            while candidate in used_names:
                suffix = f" ({i})"
                candidate = base[: 31 - len(suffix)] + suffix
                i += 1
            used_names.add(candidate)
            return wb.create_sheet(title=candidate)

        with pdfplumber.open(source_path) as pdf:
            for page_index, page in enumerate(pdf.pages):
                tables = _find_tables_multi_strategy(page)
                for table_index, table in enumerate(tables):
                    sheet_count += 1
                    label = f"Page {page_index + 1}" if len(tables) == 1 else f"Page {page_index + 1} Table {table_index + 1}"
                    ws = add_sheet(label)
                    _style_and_write_table(ws, page, table)

        if sheet_count == 0:
            # No detectable table anywhere, even with the looser strategies
            # above — fall back to text, but still split each line into
            # columns wherever there's a run of 2+ spaces (the common
            # whitespace-alignment convention), rather than dumping the
            # whole line into one cell.
            ws = add_sheet("Text")
            header = ["Page", "Column 1", "Column 2", "Column 3", "Column 4", "Column 5"]
            ws.append(header)
            for col_index in range(len(header)):
                cell = ws.cell(row=1, column=col_index + 1)
                cell.font = Font(bold=True)
                cell.fill = _HEADER_FILL
                cell.border = _CELL_BORDER
                ws.column_dimensions[get_column_letter(col_index + 1)].width = 20
            with pdfplumber.open(source_path) as pdf:
                for page_index, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    for line in text.splitlines():
                        if line.strip():
                            cells = re.split(r" {2,}|\t", line.strip())
                            ws.append([page_index + 1, *cells])
            ws.freeze_panes = "A2"

        xlsx_path = input_path + ".out.xlsx"
        cleanup_paths.append(xlsx_path)
        wb.save(xlsx_path)

        with open(xlsx_path, "rb") as f:
            data = f.read()
        return Response(data, mimetype=XLSX_MIME)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500
    finally:
        for path in cleanup_paths:
            if path and os.path.exists(path):
                os.unlink(path)


if __name__ == "__main__":
    # threaded=True so one slow conversion doesn't block other requests —
    # still Flask's dev server (fine for an internal, localhost-only service
    # with modest concurrent load; never exposed to the internet).
    app.run(host="127.0.0.1", port=PORT, threaded=True)

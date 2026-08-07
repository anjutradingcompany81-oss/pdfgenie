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
producing an empty workbook.

Run under the dedicated venv at /opt/pdfgenie-ml/venv (see whisper_server.py
for the sibling self-hosted service this matches).
"""
import os
import tempfile

from flask import Flask, Response, jsonify, request
from openpyxl import Workbook
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
                tables = page.extract_tables()
                for table_index, table in enumerate(tables):
                    if not table:
                        continue
                    sheet_count += 1
                    label = f"Page {page_index + 1}" if len(tables) == 1 else f"Page {page_index + 1} Table {table_index + 1}"
                    ws = add_sheet(label)
                    for row in table:
                        ws.append(["" if cell is None else cell for cell in row])

        if sheet_count == 0:
            # No detectable table anywhere — fall back to a text-line dump
            # (page, line) so the tool still produces something usable,
            # matching the floor the old client-side conversion had.
            ws = add_sheet("Text")
            ws.append(["Page", "Line"])
            with pdfplumber.open(source_path) as pdf:
                for page_index, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    for line in text.splitlines():
                        if line.strip():
                            ws.append([page_index + 1, line])

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

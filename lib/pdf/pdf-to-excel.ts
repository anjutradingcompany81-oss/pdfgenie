import * as XLSX from "xlsx";
import { extractLinesByPage } from "@/lib/pdf/extract-lines";

/**
 * Extracts each detected line of text into its own spreadsheet row (with the
 * source page number), rather than attempting real table/column detection —
 * arbitrary PDFs don't carry structured table data, so this is the honest,
 * correct-by-construction scope rather than guessing at column boundaries.
 */
export async function pdfToExcel(bytes: ArrayBuffer): Promise<Blob> {
  const pages = await extractLinesByPage(bytes);
  const rows: { Page: number; Line: string }[] = [];
  pages.forEach((lines, pageIndex) => {
    lines.forEach((line) => rows.push({ Page: pageIndex + 1, Line: line }));
  });

  if (rows.length === 0) {
    throw new Error("No selectable text found on this PDF — it may be a scanned image.");
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 8 }, { wch: 100 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extracted Text");
  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Blob([new Uint8Array(buf)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

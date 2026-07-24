import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 841.89; // A4 landscape, in points
const PAGE_HEIGHT = 595.28;
const MARGIN = 30;
const FONT_SIZE = 8;
const LINE_HEIGHT = FONT_SIZE * 1.8;

/**
 * Renders the first sheet of a workbook as a simple grid table — one row per
 * spreadsheet row, evenly-spaced columns, header row bolded. Cell formatting,
 * merges, formulas (values only), and multiple sheets aren't preserved; long
 * cell values are truncated to fit their column rather than wrapped.
 */
export async function excelToPdf(bytes: ArrayBuffer): Promise<Uint8Array> {
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("That file doesn't have any sheets.");
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  if (rows.length === 0) {
    throw new Error("That sheet doesn't have any rows.");
  }

  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const colWidth = (PAGE_WIDTH - MARGIN * 2) / columnCount;
  const maxCharsPerCell = Math.max(4, Math.floor(colWidth / (FONT_SIZE * 0.55)));

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  rows.forEach((row, rowIndex) => {
    if (y < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    const isHeader = rowIndex === 0;
    for (let c = 0; c < columnCount; c++) {
      const text = String(row[c] ?? "").slice(0, maxCharsPerCell);
      if (!text) continue;
      page.drawText(text, {
        x: MARGIN + c * colWidth,
        y,
        size: FONT_SIZE,
        font: isHeader ? boldFont : font,
        color: rgb(0.09, 0.075, 0.06),
      });
    }
    y -= LINE_HEIGHT;
  });

  return doc.save();
}

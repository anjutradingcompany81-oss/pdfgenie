import { PDFDocument, PDFFont, StandardFonts, LineCapStyle, rgb, type RGB as PdfLibRGB } from "pdf-lib";

export type RGB = { r: number; g: number; b: number };

export type FontFamily = "Helvetica" | "TimesRoman" | "Courier";

export const FONT_FAMILY_LABELS: Record<FontFamily, string> = {
  Helvetica: "Helvetica",
  TimesRoman: "Times New Roman",
  Courier: "Courier",
};

export type TextObject = {
  id: string;
  type: "text";
  pageIndex: number;
  /** Ratio (0-1) of page width/height, top-left origin — matches on-screen preview coordinates. */
  xRatio: number;
  yRatio: number;
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
  color: RGB;
};

export type BoxShapeKind = "rectangle" | "ellipse" | "highlight" | "whiteout";
export type LineShapeKind = "line" | "arrow";
export type ShapeKind = BoxShapeKind | LineShapeKind;

export type BoxShapeObject = {
  id: string;
  type: "shape";
  kind: BoxShapeKind;
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  strokeColor: RGB;
  strokeWidth: number;
  fillColor: RGB | null;
  opacity: number;
};

export type LineShapeObject = {
  id: string;
  type: "shape";
  kind: LineShapeKind;
  pageIndex: number;
  x1Ratio: number;
  y1Ratio: number;
  x2Ratio: number;
  y2Ratio: number;
  strokeColor: RGB;
  strokeWidth: number;
  opacity: number;
};

export type ShapeObject = BoxShapeObject | LineShapeObject;

export type ImageObject = {
  id: string;
  type: "image";
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  dataUrl: string;
  mime: "image/png" | "image/jpeg";
};

export type DrawObject = {
  id: string;
  type: "draw";
  pageIndex: number;
  /** Points in ratio (0-1) space, top-left origin. */
  points: { x: number; y: number }[];
  strokeColor: RGB;
  strokeWidth: number;
};

export type EditObject = TextObject | ShapeObject | ImageObject | DrawObject;

export function isBoxShape(shape: ShapeObject): shape is BoxShapeObject {
  return shape.kind === "rectangle" || shape.kind === "ellipse" || shape.kind === "highlight" || shape.kind === "whiteout";
}

export function isLineShape(shape: ShapeObject): shape is LineShapeObject {
  return shape.kind === "line" || shape.kind === "arrow";
}

function toPdfColor(c: RGB): PdfLibRGB {
  return rgb(c.r, c.g, c.b);
}

function standardFontFor(family: FontFamily, bold: boolean, italic: boolean): StandardFonts {
  if (family === "Helvetica") {
    if (bold && italic) return StandardFonts.HelveticaBoldOblique;
    if (bold) return StandardFonts.HelveticaBold;
    if (italic) return StandardFonts.HelveticaOblique;
    return StandardFonts.Helvetica;
  }
  if (family === "TimesRoman") {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (bold && italic) return StandardFonts.CourierBoldOblique;
  if (bold) return StandardFonts.CourierBold;
  if (italic) return StandardFonts.CourierOblique;
  return StandardFonts.Courier;
}

const ARROWHEAD_LENGTH = 12;
const ARROWHEAD_SPREAD_RAD = 0.4363; // ~25 degrees

export async function applyPdfEdits(bytes: ArrayBuffer, objects: EditObject[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();

  const fontCache = new Map<string, PDFFont>();
  async function getFont(family: FontFamily, bold: boolean, italic: boolean): Promise<PDFFont> {
    const key = `${family}-${bold}-${italic}`;
    const cached = fontCache.get(key);
    if (cached) return cached;
    const font = await doc.embedFont(standardFontFor(family, bold, italic));
    fontCache.set(key, font);
    return font;
  }

  const imageCache = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();
  async function getImage(obj: ImageObject) {
    const cached = imageCache.get(obj.id);
    if (cached) return cached;
    // pdf-lib accepts a data: URL directly for both embedders.
    const image = obj.mime === "image/png" ? await doc.embedPng(obj.dataUrl) : await doc.embedJpg(obj.dataUrl);
    imageCache.set(obj.id, image);
    return image;
  }

  for (const obj of objects) {
    const page = pages[obj.pageIndex];
    if (!page) continue;
    const { width, height } = page.getSize();

    if (obj.type === "text") {
      if (!obj.text.trim()) continue;
      const font = await getFont(obj.fontFamily, obj.bold, obj.italic);
      const lines = obj.text.split("\n");
      const lineHeight = obj.fontSize * 1.25;
      lines.forEach((line, i) => {
        page.drawText(line, {
          x: obj.xRatio * width,
          y: height - obj.yRatio * height - obj.fontSize - i * lineHeight,
          size: obj.fontSize,
          font,
          color: toPdfColor(obj.color),
        });
      });
      continue;
    }

    if (obj.type === "image") {
      const image = await getImage(obj);
      const x = obj.xRatio * width;
      const w = obj.wRatio * width;
      const h = obj.hRatio * height;
      const y = height - obj.yRatio * height - h;
      page.drawImage(image, { x, y, width: w, height: h });
      continue;
    }

    if (obj.type === "draw") {
      if (obj.points.length < 2) continue;
      const pts = obj.points.map((p) => ({ x: p.x * width, y: height - p.y * height }));
      for (let i = 1; i < pts.length; i++) {
        page.drawLine({
          start: pts[i - 1],
          end: pts[i],
          thickness: obj.strokeWidth,
          color: toPdfColor(obj.strokeColor),
          opacity: 1,
          lineCap: LineCapStyle.Round, // avoids gappy-looking joints between segments
        });
      }
      continue;
    }

    // Shapes
    if (isBoxShape(obj)) {
      const x = obj.xRatio * width;
      const w = obj.wRatio * width;
      const h = obj.hRatio * height;
      const y = height - obj.yRatio * height - h;
      const fill = obj.fillColor ? toPdfColor(obj.fillColor) : undefined;
      const hasBorder = obj.strokeWidth > 0 && obj.kind !== "highlight" && obj.kind !== "whiteout";
      if (obj.kind === "ellipse") {
        page.drawEllipse({
          x: x + w / 2,
          y: y + h / 2,
          xScale: Math.abs(w) / 2,
          yScale: Math.abs(h) / 2,
          color: fill,
          borderColor: hasBorder ? toPdfColor(obj.strokeColor) : undefined,
          borderWidth: hasBorder ? obj.strokeWidth : undefined,
          opacity: obj.opacity,
          borderOpacity: obj.opacity,
        });
      } else {
        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          color: fill,
          borderColor: hasBorder ? toPdfColor(obj.strokeColor) : undefined,
          borderWidth: hasBorder ? obj.strokeWidth : undefined,
          opacity: obj.opacity,
          borderOpacity: obj.opacity,
        });
      }
    } else if (isLineShape(obj)) {
      const start = { x: obj.x1Ratio * width, y: height - obj.y1Ratio * height };
      const end = { x: obj.x2Ratio * width, y: height - obj.y2Ratio * height };
      page.drawLine({
        start,
        end,
        thickness: obj.strokeWidth,
        color: toPdfColor(obj.strokeColor),
        opacity: obj.opacity,
        lineCap: LineCapStyle.Round,
      });
      if (obj.kind === "arrow") {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const wing1 = {
          x: end.x - ARROWHEAD_LENGTH * Math.cos(angle - ARROWHEAD_SPREAD_RAD),
          y: end.y - ARROWHEAD_LENGTH * Math.sin(angle - ARROWHEAD_SPREAD_RAD),
        };
        const wing2 = {
          x: end.x - ARROWHEAD_LENGTH * Math.cos(angle + ARROWHEAD_SPREAD_RAD),
          y: end.y - ARROWHEAD_LENGTH * Math.sin(angle + ARROWHEAD_SPREAD_RAD),
        };
        page.drawLine({ start: end, end: wing1, thickness: obj.strokeWidth, color: toPdfColor(obj.strokeColor), opacity: obj.opacity, lineCap: LineCapStyle.Round });
        page.drawLine({ start: end, end: wing2, thickness: obj.strokeWidth, color: toPdfColor(obj.strokeColor), opacity: obj.opacity, lineCap: LineCapStyle.Round });
      }
    }
  }

  return doc.save();
}

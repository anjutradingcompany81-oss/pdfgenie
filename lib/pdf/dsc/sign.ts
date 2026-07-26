import { PDFDocument, PDFFont, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import signpdf from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { Buffer as BufferPolyfill } from "buffer";
import type { CertificateInfo } from "./certificate";
import type { RGB, SignatureAppearance, SigningDetails } from "./types";

// @signpdf/* internally uses the Node Buffer API. It's pure-JS-compatible
// with browsers via the `buffer` npm package, but nothing in a Next.js
// client bundle defines the `Buffer` global by default — so we do it here,
// once, right before it's needed, instead of touching bundler config.
function ensureBufferGlobal() {
  const g = globalThis as typeof globalThis & { Buffer?: typeof BufferPolyfill };
  if (typeof g.Buffer === "undefined") {
    g.Buffer = BufferPolyfill;
  }
}

function toPdfColor(c: RGB) {
  return rgb(c.r, c.g, c.b);
}

/** Rounded-rect path in local (0,0)-(w,h) space, built from cubic Béziers so it
 * only needs the universally-supported M/L/C/Z path commands. */
function roundedRectPath(w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r === 0) return `M 0,0 L ${w},0 L ${w},${h} L 0,${h} Z`;
  const k = r * 0.5523;
  return [
    `M ${r},0`,
    `L ${w - r},0`,
    `C ${w - r + k},0 ${w},${r - k} ${w},${r}`,
    `L ${w},${h - r}`,
    `C ${w},${h - r + k} ${w - r + k},${h} ${w - r},${h}`,
    `L ${r},${h}`,
    `C ${r - k},${h} 0,${h - r + k} 0,${h - r}`,
    `L 0,${r}`,
    `C 0,${r - k} ${r - k},0 ${r},0`,
    "Z",
  ].join(" ");
}

function formatDate(d: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit", timeZone: timezone }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function formatTime(d: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

async function getStampFont(doc: PDFDocument, bold: boolean, italic: boolean): Promise<PDFFont> {
  if (bold && italic) return doc.embedFont(StandardFonts.HelveticaBoldOblique);
  if (bold) return doc.embedFont(StandardFonts.HelveticaBold);
  if (italic) return doc.embedFont(StandardFonts.HelveticaOblique);
  return doc.embedFont(StandardFonts.Helvetica);
}

type StampRect = { x: number; y: number; width: number; height: number };

async function drawSignatureStamp(
  doc: PDFDocument,
  page: PDFPage,
  rect: StampRect,
  appearance: SignatureAppearance,
  details: SigningDetails,
  certInfo: CertificateInfo
): Promise<void> {
  const { x, y, width, height } = rect;

  if (appearance.backgroundEnabled || appearance.borderEnabled) {
    page.drawSvgPath(roundedRectPath(width, height, appearance.borderRadius), {
      x,
      y,
      color: appearance.backgroundEnabled ? toPdfColor(appearance.backgroundColor) : undefined,
      opacity: appearance.opacity,
      borderColor: appearance.borderEnabled ? toPdfColor(appearance.borderColor) : undefined,
      borderWidth: appearance.borderEnabled ? appearance.borderWidth : undefined,
      borderOpacity: appearance.opacity,
    });
  }

  const font = await getStampFont(doc, appearance.bold, appearance.italic);
  const padding = 6;
  let textX = x + padding;
  const textWidth = width - padding * 2;

  if (appearance.logoDataUrl && appearance.logoMime) {
    const logoImage = appearance.logoMime === "image/png" ? await doc.embedPng(appearance.logoDataUrl) : await doc.embedJpg(appearance.logoDataUrl);
    const logoSize = Math.min(height - padding * 2, width * 0.25);
    page.drawImage(logoImage, {
      x: x + padding,
      y: y + (height - logoSize) / 2,
      width: logoSize,
      height: logoSize,
    });
    textX = x + padding * 2 + logoSize;
  }

  const lines: string[] = [];
  if (appearance.showName) lines.push(`Digitally signed by ${certInfo.ownerName}`);
  if (appearance.showOrganization && certInfo.organization) lines.push(certInfo.organization);
  if (appearance.showReason && details.reason) lines.push(`Reason: ${details.reason}`);
  if (appearance.showLocation && details.location) lines.push(`Location: ${details.location}`);
  if (appearance.showContactInfo && details.contactInfo) lines.push(`Contact: ${details.contactInfo}`);
  if (appearance.showDate || appearance.showTime) {
    const parts: string[] = [];
    if (appearance.showDate) parts.push(formatDate(details.signingTime, details.timezone));
    if (appearance.showTime) parts.push(formatTime(details.signingTime, details.timezone));
    lines.push(`Date: ${parts.join(" ")}`);
  }
  if (appearance.showCertInfo) lines.push(`Cert issued by: ${certInfo.issuer}`);

  const lineHeight = appearance.fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  let cursorY = y + height / 2 + totalTextHeight / 2 - appearance.fontSize;

  for (const line of lines) {
    if (cursorY < y) break; // stop once we'd render below the box
    page.drawText(line, {
      x: textX,
      y: cursorY,
      size: appearance.fontSize,
      font,
      color: toPdfColor(appearance.textColor),
      maxWidth: textWidth,
    });
    cursorY -= lineHeight;
  }
}

export type SignPdfInput = {
  pdfBytes: ArrayBuffer;
  p12Bytes: ArrayBuffer;
  password: string;
  certInfo: CertificateInfo;
  /** 0-based page indices to visually stamp; the cryptographic signature
   * always covers the entire document regardless of how many pages are stamped. */
  pageIndices: number[];
  placement: { xRatio: number; yRatio: number; wRatio: number; hRatio: number };
  appearance: SignatureAppearance;
  details: SigningDetails;
};

export async function signPdf({ pdfBytes, p12Bytes, password, certInfo, pageIndices, placement, appearance, details }: SignPdfInput): Promise<Uint8Array> {
  ensureBufferGlobal();

  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const targetPages = pageIndices.length > 0 ? pageIndices : [0];

  if (appearance.visible) {
    for (const pageIndex of targetPages) {
      const page = pages[pageIndex];
      if (!page) continue;
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const rect: StampRect = {
        x: placement.xRatio * pageWidth,
        y: pageHeight - placement.yRatio * pageHeight - placement.hRatio * pageHeight,
        width: placement.wRatio * pageWidth,
        height: placement.hRatio * pageHeight,
      };
      await drawSignatureStamp(doc, page, rect, appearance, details, certInfo);
    }
  }

  // Exactly one cryptographic /Sig field covers the whole document — placed
  // on the first stamped page (or a zero-size, invisible widget when the
  // "invisible signature" option is on).
  const firstPage = pages[targetPages[0]] ?? pages[0];
  const { width: pageWidth, height: pageHeight } = firstPage.getSize();
  const widgetRect = appearance.visible
    ? [
        placement.xRatio * pageWidth,
        pageHeight - placement.yRatio * pageHeight - placement.hRatio * pageHeight,
        placement.xRatio * pageWidth + placement.wRatio * pageWidth,
        pageHeight - placement.yRatio * pageHeight,
      ]
    : [0, 0, 0, 0];

  pdflibAddPlaceholder({
    pdfDoc: doc,
    pdfPage: firstPage,
    reason: details.reason || "Digitally Signed",
    contactInfo: details.contactInfo || "",
    name: certInfo.ownerName,
    location: details.location || "",
    signingTime: details.signingTime,
    widgetRect,
  });

  const withPlaceholder = await doc.save({ useObjectStreams: false });

  const signer = new P12Signer(new Uint8Array(p12Bytes), { passphrase: password });
  const signed = await signpdf.sign(withPlaceholder, signer, details.signingTime);
  return new Uint8Array(signed);
}

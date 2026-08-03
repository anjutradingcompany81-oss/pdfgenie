import { PDFDocument, PDFDict, PDFName, PDFRef, PDFArray } from "pdf-lib";
import { isEncrypted } from "@pdfsmaller/pdf-decrypt";

export type FontCheck = {
  name: string;
  embedded: boolean;
};

export type ComplianceReport = {
  encrypted: boolean;
  hasJavaScript: boolean;
  pdfVersion: string;
  fonts: FontCheck[];
  hasXmpMetadata: boolean;
  pageCount: number;
  /** True only if every automated check passed — still not a substitute for full veraPDF-grade validation. */
  likelyCompliant: boolean;
};

function resolve(doc: PDFDocument, value: unknown): PDFDict | undefined {
  if (value instanceof PDFRef) {
    const resolved = doc.context.lookup(value);
    return resolved instanceof PDFDict ? resolved : undefined;
  }
  return value instanceof PDFDict ? value : undefined;
}

function collectFonts(doc: PDFDocument): FontCheck[] {
  const seen = new Map<string, boolean>();

  for (const page of doc.getPages()) {
    const resources = page.node.Resources();
    if (!resources) continue;
    const fontDictRaw = resources.get(PDFName.of("Font"));
    const fontDict = resolve(doc, fontDictRaw);
    if (!fontDict) continue;

    for (const [key, ref] of fontDict.entries()) {
      const font = resolve(doc, ref);
      if (!font) continue;
      const baseFont = font.get(PDFName.of("BaseFont"));
      const label = baseFont ? baseFont.toString().replace(/^\//, "") : key.toString();

      const descriptorRaw = font.get(PDFName.of("FontDescriptor"));
      const descriptor = resolve(doc, descriptorRaw);
      const embedded = !!(
        descriptor &&
        (descriptor.get(PDFName.of("FontFile")) ||
          descriptor.get(PDFName.of("FontFile2")) ||
          descriptor.get(PDFName.of("FontFile3")))
      );

      // A Type0/composite font's real descriptor lives on its descendant font.
      let isEmbedded = embedded;
      if (!isEmbedded) {
        const descendants = font.get(PDFName.of("DescendantFonts"));
        if (descendants instanceof PDFArray) {
          for (let i = 0; i < descendants.size(); i++) {
            const child = resolve(doc, descendants.get(i));
            const childDescriptor = child ? resolve(doc, child.get(PDFName.of("FontDescriptor"))) : undefined;
            if (
              childDescriptor &&
              (childDescriptor.get(PDFName.of("FontFile")) ||
                childDescriptor.get(PDFName.of("FontFile2")) ||
                childDescriptor.get(PDFName.of("FontFile3")))
            ) {
              isEmbedded = true;
              break;
            }
          }
        }
      }

      if (!seen.has(label) || isEmbedded) {
        seen.set(label, isEmbedded);
      }
    }
  }

  return [...seen.entries()].map(([name, embedded]) => ({ name, embedded }));
}

function hasJavaScriptEntries(doc: PDFDocument): boolean {
  const catalog = doc.catalog;
  const namesRaw = catalog.get(PDFName.of("Names"));
  const names = resolve(doc, namesRaw);
  if (!names) return false;
  return !!names.get(PDFName.of("JavaScript"));
}

export async function checkPdfACompliance(bytes: ArrayBuffer): Promise<ComplianceReport> {
  const encrypted = await isEncrypted(new Uint8Array(bytes)).then(
    (info: { encrypted: boolean }) => info.encrypted
  );

  // An encrypted PDF can't be introspected further with pdf-lib (it can't
  // load encrypted documents at all) — return early with what we know.
  if (encrypted) {
    return {
      encrypted: true,
      hasJavaScript: false,
      pdfVersion: "",
      fonts: [],
      hasXmpMetadata: false,
      pageCount: 0,
      likelyCompliant: false,
    };
  }

  const doc = await PDFDocument.load(bytes);
  const header = new TextDecoder("latin1").decode(new Uint8Array(bytes).slice(0, 16));
  const versionMatch = header.match(/%PDF-(\d\.\d)/);
  const pdfVersion = versionMatch ? versionMatch[1] : "unknown";

  const fonts = collectFonts(doc);
  const hasJavaScript = hasJavaScriptEntries(doc);
  const hasXmpMetadata = !!doc.catalog.get(PDFName.of("Metadata"));

  const allFontsEmbedded = fonts.every((f) => f.embedded);
  const versionOk = pdfVersion !== "unknown" && parseFloat(pdfVersion) >= 1.4;

  return {
    encrypted: false,
    hasJavaScript,
    pdfVersion,
    fonts,
    hasXmpMetadata,
    pageCount: doc.getPageCount(),
    likelyCompliant: allFontsEmbedded && !hasJavaScript && versionOk && hasXmpMetadata,
  };
}

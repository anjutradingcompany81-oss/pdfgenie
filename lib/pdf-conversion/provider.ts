import type { PDFConversionProvider } from "./types";
import { ConversionError } from "./types";

let cachedProvider: PDFConversionProvider | null = null;

/**
 * Cheap, synchronous check the API route uses to decide whether to attempt
 * the professional conversion at all, or fall straight back to the existing
 * client-side conversion — used only until real provider credentials are
 * added (see .env.example), so the tool never regresses to "broken" in the
 * meantime.
 */
export function isConversionProviderConfigured(): boolean {
  const configured = (process.env.PDF_CONVERSION_PROVIDER || "adobe").toLowerCase();
  if (configured === "adobe") {
    return !!process.env.ADOBE_PDF_CLIENT_ID && !!process.env.ADOBE_PDF_CLIENT_SECRET;
  }
  return false;
}

/**
 * Selects the configured conversion provider from PDF_CONVERSION_PROVIDER.
 * Adding a second provider (Apryse, ABBYY, ...) means writing one new file
 * that implements PDFConversionProvider and adding one case here — nothing
 * in the API routes or frontend needs to change.
 */
export async function getConversionProvider(): Promise<PDFConversionProvider> {
  if (cachedProvider) return cachedProvider;

  const configured = (process.env.PDF_CONVERSION_PROVIDER || "adobe").toLowerCase();

  switch (configured) {
    case "adobe": {
      const { AdobeConversionProvider } = await import("./adobe-provider");
      cachedProvider = new AdobeConversionProvider();
      return cachedProvider;
    }
    default:
      throw new ConversionError("NOT_CONFIGURED", `Unknown PDF_CONVERSION_PROVIDER "${configured}".`);
  }
}

import { ConversionError, type PDFConversionProvider, type ProviderConversionResult } from "./types";

/**
 * No-credentials alternative to Adobe: proxies to a local Flask service
 * (scripts/pdf_conversion_server.py) running under the same
 * /opt/pdfgenie-ml venv as the Translate and Audio/Video-to-Text tools —
 * see app/api/tools/translate/route.ts for the identical proxy pattern.
 * Conversion quality is genuinely lower than Adobe's on complex documents
 * (table detection especially), but it's free, needs no account, and
 * everything stays on this server.
 */
const BASE_URL = `http://127.0.0.1:${process.env.PDF_CONVERSION_SELF_HOSTED_PORT || "5007"}`;
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

const MIME_BY_FORMAT = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

async function convert(
  pdfBytes: Uint8Array,
  endpoint: "convert-to-docx" | "convert-to-xlsx",
  targetFormat: "docx" | "xlsx",
  options?: { password?: string }
): Promise<ProviderConversionResult> {
  const form = new FormData();
  form.append("file", new Blob([Buffer.from(pdfBytes)], { type: "application/pdf" }), "input.pdf");
  if (options?.password) form.append("password", options.password);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${endpoint}`, { method: "POST", body: form, signal: controller.signal });
  } catch {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "Conversion service temporarily unavailable — please try again shortly.");
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 423) throw new ConversionError("PASSWORD_REQUIRED", "This PDF is password-protected.");
  if (res.status === 401) throw new ConversionError("INCORRECT_PASSWORD", "That password didn't unlock the PDF.");
  if (!res.ok) throw new ConversionError("PROVIDER_UNAVAILABLE", "The conversion service couldn't process this file.");

  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, mimeType: MIME_BY_FORMAT[targetFormat] };
}

export class SelfHostedConversionProvider implements PDFConversionProvider {
  readonly name = "self-hosted";

  convertToWord(pdfBytes: Uint8Array, options?: { password?: string }): Promise<ProviderConversionResult> {
    return convert(pdfBytes, "convert-to-docx", "docx", options);
  }

  convertToExcel(pdfBytes: Uint8Array, options?: { password?: string }): Promise<ProviderConversionResult> {
    return convert(pdfBytes, "convert-to-xlsx", "xlsx", options);
  }
}

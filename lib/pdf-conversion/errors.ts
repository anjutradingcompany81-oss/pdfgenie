import { ConversionError, type ConversionErrorCode } from "./types";

const HTTP_STATUS_BY_CODE: Record<ConversionErrorCode, number> = {
  INVALID_FILE: 400,
  FILE_TOO_LARGE: 413,
  TOO_MANY_PAGES: 413,
  PASSWORD_REQUIRED: 423,
  INCORRECT_PASSWORD: 401,
  CORRUPTED_PDF: 400,
  PROVIDER_UNAVAILABLE: 503,
  TIMEOUT: 504,
  RATE_LIMITED: 429,
  NOT_CONFIGURED: 503,
  UNKNOWN: 500,
};

const DEFAULT_MESSAGE_BY_CODE: Record<ConversionErrorCode, string> = {
  INVALID_FILE: "Unsupported file type.",
  FILE_TOO_LARGE: "File exceeds the maximum allowed size.",
  TOO_MANY_PAGES: "This PDF has too many pages to convert.",
  PASSWORD_REQUIRED: "Password protected PDF detected.",
  INCORRECT_PASSWORD: "That password didn't unlock the PDF.",
  CORRUPTED_PDF: "PDF appears corrupted.",
  PROVIDER_UNAVAILABLE: "Conversion service temporarily unavailable — please try again shortly.",
  TIMEOUT: "Conversion timed out — please try again.",
  RATE_LIMITED: "Rate limit reached — please wait a few minutes and try again.",
  NOT_CONFIGURED: "PDF conversion isn't available right now.",
  UNKNOWN: "Unable to convert this PDF.",
};

/**
 * Turns any thrown error into a safe, user-facing { status, code, message }
 * triple. Never forwards stack traces, file paths, or provider response
 * bodies to the client — those get logged server-side instead (see
 * logConversionEvent) so they're still available for debugging.
 */
export function toSafeErrorResponse(err: unknown): { status: number; code: ConversionErrorCode; message: string } {
  if (err instanceof ConversionError) {
    return { status: HTTP_STATUS_BY_CODE[err.code], code: err.code, message: err.message || DEFAULT_MESSAGE_BY_CODE[err.code] };
  }
  return { status: 500, code: "UNKNOWN", message: DEFAULT_MESSAGE_BY_CODE.UNKNOWN };
}

/** Structured, password/content-free logging for the conversion lifecycle. */
export function logConversionEvent(event: string, details: Record<string, unknown>): void {
  const { password: _password, ...safeDetails } = details as Record<string, unknown> & { password?: unknown };
  void _password;
  console.log(JSON.stringify({ scope: "pdf-conversion", event, ...safeDetails, at: new Date().toISOString() }));
}

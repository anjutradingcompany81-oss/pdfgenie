export type ConversionTargetFormat = "docx" | "xlsx";

export type PdfAnalysis = {
  pageCount: number;
  fileSizeBytes: number;
  encrypted: boolean;
  hasDigitalText: boolean;
  scannedPageCount: number;
  isScanned: boolean;
  isMixed: boolean;
};

export type ProviderConversionResult = {
  bytes: Uint8Array;
  mimeType: string;
};

/**
 * A provider only has to know how to talk to its own API. Everything else —
 * validation, job tracking, temp-file lifecycle, retries, error mapping — is
 * handled once in the shared conversion service, so swapping providers never
 * touches the frontend or the API routes.
 */
export interface PDFConversionProvider {
  readonly name: string;
  convertToWord(pdfBytes: Uint8Array, options?: { password?: string }): Promise<ProviderConversionResult>;
  convertToExcel(pdfBytes: Uint8Array, options?: { password?: string }): Promise<ProviderConversionResult>;
}

export type ConversionStage =
  | "uploading"
  | "analyzing"
  | "queued"
  | "converting"
  | "preparing_download"
  | "completed"
  | "failed";

export type ConversionJobRecord = {
  id: string;
  targetFormat: ConversionTargetFormat;
  originalFileName: string;
  stage: ConversionStage;
  errorMessage: string | null;
  errorCode: ConversionErrorCode | null;
  resultPath: string | null;
  resultMimeType: string | null;
  createdAt: number;
  expiresAt: number;
};

export type ConversionErrorCode =
  | "INVALID_FILE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_PAGES"
  | "PASSWORD_REQUIRED"
  | "INCORRECT_PASSWORD"
  | "CORRUPTED_PDF"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "NOT_CONFIGURED"
  | "UNKNOWN";

export class ConversionError extends Error {
  code: ConversionErrorCode;
  constructor(code: ConversionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ConversionError";
  }
}

import { ConversionError, type PDFConversionProvider, type ProviderConversionResult } from "./types";

/**
 * Adobe PDF Services API client, implemented directly against Adobe's
 * documented REST endpoints (OAuth2 client-credentials -> upload asset ->
 * submit export job -> poll -> download) rather than the adobe-pdfservices
 * Node SDK, so this file has no dependency on a particular SDK version's
 * method signatures. Adobe's REST surface has shifted across API versions in
 * the past — if a real account shows a different response shape than what's
 * coded here, this file is the only place that needs to change; nothing
 * upstream (job store, API routes, frontend) knows these details exist.
 *
 * Docs to verify against when wiring up real credentials:
 * https://developer.adobe.com/document-services/docs/apis/
 */

const AUTH_URL = "https://pdf-services.adobe.io/token";
const API_BASE = "https://pdf-services.adobe.io";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — long enough for a large document, short enough not to hang the route forever
const MAX_RETRIES = 2;

type CachedToken = { accessToken: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function requireCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.ADOBE_PDF_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ConversionError(
      "NOT_CONFIGURED",
      "PDF conversion isn't configured yet — ADOBE_PDF_CLIENT_ID/ADOBE_PDF_CLIENT_SECRET are missing."
    );
  }
  return { clientId, clientSecret };
}

async function withRetry<T>(fn: () => Promise<T>, isRetryable: (err: unknown) => boolean): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === MAX_RETRIES) break;
      const backoffMs = 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw lastError;
}

function isRetryableHttpError(err: unknown): boolean {
  if (err instanceof ConversionError) return err.code === "PROVIDER_UNAVAILABLE";
  return true; // network-level failures (fetch throwing) are transient by default
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }
  const { clientId, clientSecret } = requireCredentials();

  const res = await withRetry(
    () =>
      fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
      }),
    isRetryableHttpError
  );

  if (!res.ok) {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "Couldn't authenticate with the conversion service.");
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3300) * 1000 };
  return cachedToken.accessToken;
}

async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const { clientId } = requireCredentials();
  const token = await getAccessToken();
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "x-api-key": clientId,
    },
  });
}

async function uploadAsset(pdfBytes: Uint8Array): Promise<string> {
  const createRes = await withRetry(
    () =>
      authedFetch(`${API_BASE}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType: "application/pdf" }),
      }),
    isRetryableHttpError
  );
  if (!createRes.ok) {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "Couldn't prepare the file for conversion.");
  }
  const { uploadUri, assetID } = (await createRes.json()) as { uploadUri: string; assetID: string };

  const uploadRes = await withRetry(
    () => fetch(uploadUri, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: Buffer.from(pdfBytes) }),
    isRetryableHttpError
  );
  if (!uploadRes.ok) {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "Couldn't upload the file for conversion.");
  }
  return assetID;
}

/** Adobe requires a password-protected PDF to go through Remove Protection before export accepts it. */
async function removeProtection(assetID: string, password: string): Promise<string> {
  const submitRes = await authedFetch(`${API_BASE}/operation/removeprotection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetID, password }),
  });

  if (submitRes.status === 400 || submitRes.status === 422) {
    throw new ConversionError("INCORRECT_PASSWORD", "That password didn't unlock the PDF.");
  }
  if (!submitRes.ok) {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "Couldn't process the password-protected PDF.");
  }

  const location = submitRes.headers.get("location");
  if (!location) throw new ConversionError("PROVIDER_UNAVAILABLE", "Conversion service returned an unexpected response.");

  const result = await pollUntilDone(location);
  const decryptedAssetId = (result as { asset?: { assetID?: string } }).asset?.assetID;
  if (!decryptedAssetId) throw new ConversionError("INCORRECT_PASSWORD", "That password didn't unlock the PDF.");
  return decryptedAssetId;
}

async function pollUntilDone(statusUrl: string): Promise<unknown> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let consecutiveFailures = 0;

  while (Date.now() < deadline) {
    try {
      const res = await authedFetch(statusUrl, { method: "GET" });
      if (!res.ok) throw new ConversionError("PROVIDER_UNAVAILABLE", "Lost contact with the conversion service.");

      const data = (await res.json()) as { status: string; error?: { message?: string } };
      consecutiveFailures = 0;
      if (data.status === "done") return data;
      if (data.status === "failed") {
        throw new ConversionError("UNKNOWN", data.error?.message || "The conversion service couldn't process this file.");
      }
    } catch (err) {
      // A single dropped poll shouldn't abort a job that's otherwise fine —
      // only give up after several polls in a row fail.
      if (err instanceof ConversionError && err.code === "UNKNOWN") throw err;
      consecutiveFailures += 1;
      if (consecutiveFailures >= 3) {
        throw new ConversionError("PROVIDER_UNAVAILABLE", "Lost contact with the conversion service.");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new ConversionError("TIMEOUT", "This conversion is taking longer than expected — please try again.");
}

async function downloadResult(downloadUri: string): Promise<Uint8Array> {
  const res = await fetch(downloadUri);
  if (!res.ok) {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "Couldn't retrieve the converted file.");
  }
  return new Uint8Array(await res.arrayBuffer());
}

const MIME_BY_FORMAT = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

async function convert(
  pdfBytes: Uint8Array,
  targetFormat: "docx" | "xlsx",
  options?: { password?: string }
): Promise<ProviderConversionResult> {
  requireCredentials();

  let assetID = await uploadAsset(pdfBytes);
  if (options?.password) {
    assetID = await removeProtection(assetID, options.password);
  }

  const submitRes = await authedFetch(`${API_BASE}/operation/exportpdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetID, targetFormat }),
  });

  if (submitRes.status === 423 || submitRes.status === 401) {
    throw new ConversionError("PASSWORD_REQUIRED", "This PDF is password-protected.");
  }
  if (!submitRes.ok) {
    throw new ConversionError("PROVIDER_UNAVAILABLE", "The conversion service couldn't start this job.");
  }

  const location = submitRes.headers.get("location");
  if (!location) throw new ConversionError("PROVIDER_UNAVAILABLE", "Conversion service returned an unexpected response.");

  const result = (await pollUntilDone(location)) as { asset?: { downloadUri?: string } };
  const downloadUri = result.asset?.downloadUri;
  if (!downloadUri) throw new ConversionError("UNKNOWN", "The conversion finished without producing a file.");

  const bytes = await downloadResult(downloadUri);
  return { bytes, mimeType: MIME_BY_FORMAT[targetFormat] };
}

export class AdobeConversionProvider implements PDFConversionProvider {
  readonly name = "adobe";

  convertToWord(pdfBytes: Uint8Array, options?: { password?: string }): Promise<ProviderConversionResult> {
    return convert(pdfBytes, "docx", options);
  }

  convertToExcel(pdfBytes: Uint8Array, options?: { password?: string }): Promise<ProviderConversionResult> {
    return convert(pdfBytes, "xlsx", options);
  }
}

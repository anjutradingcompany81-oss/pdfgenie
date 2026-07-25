import type { TransientSmtpConfig } from "@/lib/mail-merge/send-job";

/** Parses the JSON-stringified SmtpConfigState sent as a form field. Returns undefined for "use default sender" or malformed input. */
export function parseSmtpConfig(raw: FormDataEntryValue | null): TransientSmtpConfig | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    const data = JSON.parse(raw);
    if (!data?.useCustom) return undefined;
    if (!data.host || !data.user || !data.password || !data.fromEmail) return undefined;
    return {
      host: String(data.host),
      port: Number(data.port) || 587,
      secure: Boolean(data.secure),
      user: String(data.user),
      password: String(data.password),
      fromEmail: String(data.fromEmail),
      fromName: data.fromName ? String(data.fromName) : undefined,
    };
  } catch {
    return undefined;
  }
}

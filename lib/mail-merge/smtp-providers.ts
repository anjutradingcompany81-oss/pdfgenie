export type SmtpConfigState = {
  useCustom: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

export const EMPTY_SMTP_CONFIG: SmtpConfigState = {
  useCustom: false,
  host: "",
  port: "587",
  secure: false,
  user: "",
  password: "",
  fromEmail: "",
  fromName: "",
};

export type ProviderPreset = { host: string; port: string; secure: boolean; label: string };

// Common providers' SMTP settings, keyed by email domain, so the user only
// has to type their email + password — everything else is inferred.
export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  "gmail.com": { host: "smtp.gmail.com", port: "587", secure: false, label: "Gmail" },
  "googlemail.com": { host: "smtp.gmail.com", port: "587", secure: false, label: "Gmail" },
  // smtp.office365.com is the Microsoft 365 (work/school) relay — personal
  // outlook.com/hotmail.com/live.com/msn.com accounts use a different one.
  "outlook.com": { host: "smtp-mail.outlook.com", port: "587", secure: false, label: "Outlook" },
  "hotmail.com": { host: "smtp-mail.outlook.com", port: "587", secure: false, label: "Outlook" },
  "live.com": { host: "smtp-mail.outlook.com", port: "587", secure: false, label: "Outlook" },
  "msn.com": { host: "smtp-mail.outlook.com", port: "587", secure: false, label: "Outlook" },
  "yahoo.com": { host: "smtp.mail.yahoo.com", port: "465", secure: true, label: "Yahoo Mail" },
  "ymail.com": { host: "smtp.mail.yahoo.com", port: "465", secure: true, label: "Yahoo Mail" },
  "icloud.com": { host: "smtp.mail.me.com", port: "587", secure: false, label: "iCloud Mail" },
  "me.com": { host: "smtp.mail.me.com", port: "587", secure: false, label: "iCloud Mail" },
  "zoho.com": { host: "smtp.zoho.com", port: "465", secure: true, label: "Zoho Mail" },
  "aol.com": { host: "smtp.aol.com", port: "587", secure: false, label: "AOL Mail" },
  "yandex.com": { host: "smtp.yandex.com", port: "465", secure: true, label: "Yandex Mail" },
  "gmx.com": { host: "mail.gmx.com", port: "587", secure: false, label: "GMX Mail" },
};

export function detectProvider(email: string): ProviderPreset | null {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;
  return PROVIDER_PRESETS[domain] ?? null;
}

"use client";

import { KeyRound, Mail, Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";

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

type ProviderPreset = { host: string; port: string; secure: boolean; label: string };

// Common providers' SMTP settings, keyed by email domain, so the user only
// has to type their email + password — everything else is inferred.
const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  "gmail.com": { host: "smtp.gmail.com", port: "587", secure: false, label: "Gmail" },
  "googlemail.com": { host: "smtp.gmail.com", port: "587", secure: false, label: "Gmail" },
  "outlook.com": { host: "smtp.office365.com", port: "587", secure: false, label: "Outlook" },
  "hotmail.com": { host: "smtp.office365.com", port: "587", secure: false, label: "Outlook" },
  "live.com": { host: "smtp.office365.com", port: "587", secure: false, label: "Outlook" },
  "msn.com": { host: "smtp.office365.com", port: "587", secure: false, label: "Outlook" },
  "yahoo.com": { host: "smtp.mail.yahoo.com", port: "465", secure: true, label: "Yahoo Mail" },
  "ymail.com": { host: "smtp.mail.yahoo.com", port: "465", secure: true, label: "Yahoo Mail" },
  "icloud.com": { host: "smtp.mail.me.com", port: "587", secure: false, label: "iCloud Mail" },
  "me.com": { host: "smtp.mail.me.com", port: "587", secure: false, label: "iCloud Mail" },
  "zoho.com": { host: "smtp.zoho.com", port: "465", secure: true, label: "Zoho Mail" },
  "aol.com": { host: "smtp.aol.com", port: "587", secure: false, label: "AOL Mail" },
  "yandex.com": { host: "smtp.yandex.com", port: "465", secure: true, label: "Yandex Mail" },
  "gmx.com": { host: "mail.gmx.com", port: "587", secure: false, label: "GMX Mail" },
};

function detectProvider(email: string): ProviderPreset | null {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;
  return PROVIDER_PRESETS[domain] ?? null;
}

export function SmtpConfigForm({
  value,
  onChange,
}: {
  value: SmtpConfigState;
  onChange: (next: SmtpConfigState) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [unrecognized, setUnrecognized] = useState(false);

  function set<K extends keyof SmtpConfigState>(key: K, val: SmtpConfigState[K]) {
    onChange({ ...value, [key]: val });
  }

  // While typing, just mirror the email into user + fromEmail — the two
  // are the same account for the vast majority of senders.
  function handleEmailInput(email: string) {
    onChange({ ...value, user: email, fromEmail: email });
  }

  // On blur (email finished typing), look up the provider and fill in the
  // server details. Kept separate from onInput so we're not flashing an
  // "unrecognized" warning on every keystroke before the domain is complete.
  function handleEmailBlur() {
    const preset = detectProvider(value.fromEmail);
    if (preset) {
      onChange({ ...value, host: preset.host, port: preset.port, secure: preset.secure });
      setDetected(preset.label);
      setUnrecognized(false);
    } else if (value.fromEmail.includes("@")) {
      setDetected(null);
      setUnrecognized(true);
      setShowAdvanced(true);
    } else {
      setDetected(null);
      setUnrecognized(false);
    }
  }

  const inputClass =
    "w-full rounded-full border border-brand-brown-dark/15 px-4 py-2.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue";

  return (
    <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <label className="flex items-center gap-2 text-sm font-semibold text-brand-brown-dark">
        <input
          type="checkbox"
          checked={value.useCustom}
          onChange={(e) => set("useCustom", e.target.checked)}
          className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
        />
        Use my own SMTP account
      </label>
      <p className="mt-1 text-xs text-brand-brown-dark/70">
        Leave unchecked to send from PDF Genie&apos;s configured address.
      </p>

      {value.useCustom && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <input
                type="email"
                value={value.fromEmail}
                onChange={(e) => handleEmailInput(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="Your email address"
                autoComplete="email"
                className={`${inputClass} pl-9`}
              />
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-brown-dark/70" />
            </div>
            <div className="relative">
              <input
                type="password"
                value={value.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Password / app password"
                autoComplete="off"
                className={`${inputClass} pl-9`}
              />
              <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-brown-dark/70" />
            </div>
          </div>

          {detected && (
            <p className="text-xs font-medium text-status-success">
              Detected {detected} — server settings filled in automatically.
            </p>
          )}
          {unrecognized && (
            <p className="text-xs font-medium text-status-warning">
              Didn&apos;t recognize that email provider — fill in the server details below.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue-deep"
          >
            <Settings2 size={13} />
            {showAdvanced ? "Hide server details" : "Edit server details"}
          </button>

          {showAdvanced && (
            <div className="grid gap-3 border-t border-brand-brown-dark/10 pt-3 sm:grid-cols-2">
              <input
                value={value.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="smtp.example.com"
                className={inputClass}
              />
              <input
                value={value.port}
                onChange={(e) => set("port", e.target.value)}
                placeholder="Port (e.g. 587)"
                className={inputClass}
              />
              <input
                value={value.user}
                onChange={(e) => set("user", e.target.value)}
                placeholder="SMTP username"
                className={inputClass}
              />
              <input
                value={value.fromName}
                onChange={(e) => set("fromName", e.target.value)}
                placeholder="From name (optional)"
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={value.secure}
                  onChange={(e) => set("secure", e.target.checked)}
                  className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
                />
                Use TLS (usually needed for port 465)
              </label>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-brand-brown-dark/70">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Never stored — used only in memory to send this one job, then discarded.
          </p>
        </div>
      )}
    </div>
  );
}

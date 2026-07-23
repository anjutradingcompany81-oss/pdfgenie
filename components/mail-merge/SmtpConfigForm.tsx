"use client";

import { KeyRound, ShieldCheck } from "lucide-react";

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

export function SmtpConfigForm({
  value,
  onChange,
}: {
  value: SmtpConfigState;
  onChange: (next: SmtpConfigState) => void;
}) {
  function set<K extends keyof SmtpConfigState>(key: K, val: SmtpConfigState[K]) {
    onChange({ ...value, [key]: val });
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
      <p className="mt-1 text-xs text-brand-brown-dark/50">
        Leave unchecked to send from PDF Genie&apos;s configured address.
      </p>

      {value.useCustom && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
          <div className="relative">
            <input
              type="password"
              value={value.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="SMTP password"
              autoComplete="off"
              className={`${inputClass} pl-9`}
            />
            <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-brown-dark/30" />
          </div>
          <input
            type="email"
            value={value.fromEmail}
            onChange={(e) => set("fromEmail", e.target.value)}
            placeholder="From email"
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

          <p className="flex items-start gap-2 text-xs text-brand-brown-dark/45 sm:col-span-2">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Never stored — used only in memory to send this one job, then discarded.
          </p>
        </div>
      )}
    </div>
  );
}

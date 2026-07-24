"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

type Settings = {
  siteName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  footerText: string | null;
  maxFileSizeMb: number;
  allowedFileTypes: string;
  maintenanceMode: boolean;
};

export function SiteSettingsForm({ initial }: { initial: Settings }) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin-dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      setMessage(res.ok ? "Saved." : data.error || "Couldn't save settings.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue";

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-5 rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">Website name</label>
        <input
          value={values.siteName}
          onChange={(e) => set("siteName", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">Logo URL</label>
        <input
          value={values.logoUrl || ""}
          onChange={(e) => set("logoUrl", e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">Contact email</label>
        <input
          type="email"
          value={values.contactEmail || ""}
          onChange={(e) => set("contactEmail", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">Footer text</label>
        <input
          value={values.footerText || ""}
          onChange={(e) => set("footerText", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">
            Max upload size (MB)
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={values.maxFileSizeMb}
            onChange={(e) => set("maxFileSizeMb", Number(e.target.value) || 1)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">
            Allowed file types
          </label>
          <input
            value={values.allowedFileTypes}
            onChange={(e) => set("allowedFileTypes", e.target.value)}
            placeholder="pdf,png,jpg,docx"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
        <input
          type="checkbox"
          checked={values.maintenanceMode}
          onChange={(e) => set("maintenanceMode", e.target.checked)}
          className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
        />
        Maintenance mode
      </label>
      <p className="-mt-3 text-xs text-brand-brown-dark/70">
        Saved and available to the app, but not yet enforced anywhere on the public site — no page
        currently checks this flag.
      </p>

      {message && <p className="text-sm font-medium text-brand-blue-deep">{message}</p>}

      <button
        type="submit"
        data-hover="true"
        disabled={busy}
        className="flex items-center gap-2 rounded-full bg-brand-blue-deep px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        Save settings
      </button>
    </form>
  );
}

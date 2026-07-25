"use client";

import { KeyRound, Loader2, Mail, ShieldCheck, Settings2 } from "lucide-react";
import { useState } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { detectProvider, EMPTY_SMTP_CONFIG, type ProviderPreset, type SmtpConfigState } from "@/lib/mail-merge/smtp-providers";

const inputClass =
  "w-full rounded-full border border-brand-brown-dark/15 px-4 py-2.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue";

export function SendMethodStep({ onContinue }: { onContinue: (config: SmtpConfigState) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [detected, setDetected] = useState<ProviderPreset | null>(null);
  const [unrecognized, setUnrecognized] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [fromName, setFromName] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleEmailBlur() {
    const preset = detectProvider(email);
    if (preset) {
      setHost(preset.host);
      setPort(preset.port);
      setSecure(preset.secure);
      setDetected(preset);
      setUnrecognized(false);
    } else if (email.includes("@")) {
      setDetected(null);
      setUnrecognized(true);
      setShowAdvanced(true);
    } else {
      setDetected(null);
      setUnrecognized(false);
    }
  }

  async function handleVerifyAndContinue() {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!host) {
      setError("Enter your SMTP server details, or use a recognized provider like Gmail or Outlook.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/mail-merge/verify-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port, secure, user: email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Couldn't sign in with those details.");
        return;
      }
      onContinue({
        useCustom: true,
        host,
        port,
        secure,
        user: email,
        password,
        fromEmail: email,
        fromName,
      });
    } catch {
      setError("Something went wrong verifying that account. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="surface-card space-y-5 rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <div>
        <h2 className="text-lg font-bold text-brand-brown-dark">How do you want to send this campaign?</h2>
        <p className="mt-1 text-sm text-brand-brown-dark/70">
          Sign in with your own email account so recipients see it come from you, or skip and send from
          PDF Genie&apos;s address.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-brand-blue/40 bg-brand-blue/5 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-brown-dark">
            <Mail size={16} className="text-brand-blue-deep" />
            Login using Email (SMTP)
          </div>
          <p className="mt-1 text-xs text-brand-brown-dark/70">Gmail, Outlook, Yahoo, Zoho, and more.</p>
        </div>
        <div
          aria-disabled="true"
          className="rounded-xl border border-brand-brown-dark/10 bg-brand-cream/40 p-4 opacity-60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-brand-brown-dark">Sign in with Microsoft</span>
            <span className="rounded-full bg-brand-brown-dark/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-brown-dark/70">
              Coming soon
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-brown-dark/70">
            One-click Microsoft login, no password needed. Meanwhile, Outlook/Hotmail already works with an
            app password via Email (SMTP) on the left.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password / app password"
              autoComplete="off"
              className={`${inputClass} pl-9`}
            />
            <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-brown-dark/70" />
          </div>
        </div>

        {detected && (
          <p className="text-xs font-medium text-status-success">
            Detected {detected.label} — using {detected.host}:{detected.port}.
          </p>
        )}
        {detected?.label === "Gmail" && (
          <p className="text-xs text-brand-brown-dark/70">
            Gmail needs an app password, not your regular password — generate one at{" "}
            <span className="font-mono">myaccount.google.com/apppasswords</span>.
          </p>
        )}
        {detected?.label === "Outlook" && (
          <p className="text-xs text-brand-brown-dark/70">
            Outlook.com/Hotmail needs an app password, not your regular password — generate one at{" "}
            <span className="font-mono">account.live.com/proofs/AppPassword</span>. Using a work/school
            (Microsoft 365) address instead? SMTP AUTH must be enabled for that mailbox by an admin first.
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
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.example.com" className={inputClass} />
            <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="Port (e.g. 587)" className={inputClass} />
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="From name (optional)"
              className={`${inputClass} sm:col-span-2`}
            />
            <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70 sm:col-span-2">
              <input
                type="checkbox"
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
                className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
              />
              Use TLS (usually needed for port 465)
            </label>
          </div>
        )}

        {error && <p className="whitespace-pre-line text-sm font-medium text-status-danger">{error}</p>}

        <MagneticButton onClick={handleVerifyAndContinue} disabled={verifying}>
          {verifying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify & continue"
          )}
        </MagneticButton>

        <p className="flex items-start gap-2 text-xs text-brand-brown-dark/70">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Never stored — used only in memory to send this one job, then discarded.
        </p>
      </div>

      <div className="border-t border-brand-brown-dark/10 pt-4">
        <button
          type="button"
          data-hover="true"
          onClick={() => onContinue(EMPTY_SMTP_CONFIG)}
          className="text-xs font-semibold text-brand-brown-dark/60 hover:text-brand-brown-dark hover:underline"
        >
          Skip — send from PDF Genie&apos;s address instead
        </button>
      </div>
    </div>
  );
}

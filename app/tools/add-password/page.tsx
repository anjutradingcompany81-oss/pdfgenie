"use client";

import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function AddPasswordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
    setPassword("");
    setConfirm("");
    setError(null);
    setDone(false);
  }

  async function handleAddPassword() {
    if (!file) return;
    if (password.length < 4) {
      setError("Use a password with at least 4 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const { encryptPDF } = await import("@pdfsmaller/pdf-encrypt");
      const buffer = await file.arrayBuffer();
      const encrypted = await encryptPDF(new Uint8Array(buffer), password, {
        algorithm: "AES-256",
      });
      downloadBlob(bytesToBlob(encrypted, "application/pdf"), "password-protected.pdf");
      setDone(true);
    } catch {
      setError("Couldn't protect that PDF — it may already be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Lock}
      title="Add a password to a PDF"
      description="Lock a PDF behind a password so only people you share it with can open it."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div className="space-y-4">
            <div>
              <label htmlFor="pwd" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Password
              </label>
              <div className="relative">
                <input
                  id="pwd"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 pr-12 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
                  placeholder="Enter a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown-dark/40 hover:text-brand-brown-dark"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="pwd-confirm" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Confirm password
              </label>
              <input
                id="pwd-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
                placeholder="Re-enter the password"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">
              Protected PDF downloaded. Keep the password somewhere safe — it can&apos;t be recovered.
            </p>
          )}

          <MagneticButton onClick={handleAddPassword} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Protecting…
              </>
            ) : (
              "Add password"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

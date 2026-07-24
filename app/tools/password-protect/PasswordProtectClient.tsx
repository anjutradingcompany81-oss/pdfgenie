"use client";

import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Direction = "add" | "remove";

export default function PasswordProtectPage() {
  const [direction, setDirection] = useState<Direction>("add");

  return (
    <ToolShell
      icon={Lock}
      title="Password Protection"
      description="Lock a PDF behind a password, or unlock one you already have the password for."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "add"} onClick={() => setDirection("add")}>
          Add password
        </TabButton>
        <TabButton active={direction === "remove"} onClick={() => setDirection("remove")}>
          Remove password
        </TabButton>
      </div>

      {direction === "add" ? <AddPassword /> : <RemovePassword />}

      <PrivacyNote />
    </ToolShell>
  );
}

function AddPassword() {
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
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown-dark/70 hover:text-brand-brown-dark"
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

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
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
        </>
      )}
    </div>
  );
}

function friendlyRemoveError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("Incorrect password")) return "That password doesn't match this PDF.";
  if (message.includes("not encrypted")) return "This PDF isn't password-protected — nothing to remove.";
  if (message.includes("Unsupported encryption")) {
    return "This PDF uses an encryption method we don't support yet (AES-128). Try re-saving it with AES-256 or RC4 protection first.";
  }
  return "Couldn't remove the password — the file may be corrupted.";
}

function RemovePassword() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
    setPassword("");
    setError(null);
    setDone(false);
  }

  async function handleRemovePassword() {
    if (!file || !password) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const { decryptPDF } = await import("@pdfsmaller/pdf-decrypt");
      const buffer = await file.arrayBuffer();
      const decrypted = await decryptPDF(new Uint8Array(buffer), password);
      downloadBlob(bytesToBlob(decrypted, "application/pdf"), "unlocked.pdf");
      setDone(true);
    } catch (err) {
      setError(friendlyRemoveError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a protected PDF here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div>
            <label htmlFor="current-pwd" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
              Current password
            </label>
            <input
              id="current-pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              placeholder="Enter the PDF's password"
            />
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">Unlocked PDF downloaded.</p>}

          <MagneticButton onClick={handleRemovePassword} disabled={busy || !password}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Unlocking…
              </>
            ) : (
              "Remove password"
            )}
          </MagneticButton>
        </>
      )}
    </div>
  );
}

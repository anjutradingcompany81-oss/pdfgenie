"use client";

import { Unlock, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("Incorrect password")) return "That password doesn't match this PDF.";
  if (message.includes("not encrypted")) return "This PDF isn't password-protected — nothing to remove.";
  if (message.includes("Unsupported encryption")) {
    return "This PDF uses an encryption method we don't support yet (AES-128). Try re-saving it with AES-256 or RC4 protection first.";
  }
  return "Couldn't remove the password — the file may be corrupted.";
}

export default function RemovePasswordPage() {
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
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Unlock}
      title="Remove a password from a PDF"
      description="Unlock a password-protected PDF so it opens without a prompt."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a protected PDF here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
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

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">Unlocked PDF downloaded.</p>
          )}

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
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

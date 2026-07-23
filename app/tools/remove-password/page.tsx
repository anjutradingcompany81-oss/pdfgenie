"use client";

import { Unlock, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { ComingSoon } from "@/components/tools/ComingSoon";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function RemovePasswordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPassword("");
    setNotice(null);
  }

  async function handleRemovePassword() {
    if (!file || !password) return;
    setBusy(true);
    setNotice(null);
    try {
      // TODO: Decrypting a real user-password-protected PDF needs a proper
      // PDF decryption implementation (RC4/AES-256 per the PDF spec, driven
      // by the supplied password) — pdf-lib does not support this, and
      // @pdfsmaller/pdf-encrypt (already a dependency) only encrypts, it has
      // no decrypt path. Wire up real decryption here once a suitable
      // library/implementation is in place.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setNotice("Password removal isn't available yet — check back soon.");
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

          {notice && <ComingSoon note={notice} />}

          <MagneticButton onClick={handleRemovePassword} disabled={busy || !password}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking…
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

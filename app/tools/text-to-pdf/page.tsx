"use client";

import { FileType, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { textToPdf } from "@/lib/pdf/text";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function TextToPdfPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleConvert() {
    if (!text.trim()) {
      setError("Type or paste some text first.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const bytes = await textToPdf(text);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "document.pdf");
      setDone(true);
    } catch {
      setError("Something went wrong creating that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FileType}
      title="Convert text to PDF"
      description="Type or paste plain text and turn it into a clean, downloadable PDF."
    >
      <div className="space-y-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Type or paste your text here…"
          className="w-full rounded-2xl border border-brand-brown-dark/15 bg-white px-5 py-4 text-sm text-brand-brown-dark placeholder:text-brand-brown-dark/35 focus:border-brand-blue focus:outline-none"
        />

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        {done && !error && (
          <p className="text-sm font-medium text-brand-blue-deep">PDF downloaded.</p>
        )}

        <MagneticButton onClick={handleConvert} disabled={busy || !text.trim()}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Converting…
            </>
          ) : (
            "Convert to PDF"
          )}
        </MagneticButton>
      </div>

      <PrivacyNote />
    </ToolShell>
  );
}

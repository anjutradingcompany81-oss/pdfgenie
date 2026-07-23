"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { ComingSoon } from "@/components/tools/ComingSoon";
import { MagneticButton } from "@/components/ui/MagneticButton";

type PlaceholderToolProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  accept: string;
  dropLabel: string;
  actionLabel: string;
  comingSoonNote: string;
};

// Shared UI shell for tools whose processing isn't implemented yet. The
// upload flow is real; the action button is wired up but intentionally
// stops short of processing — see the TODO in each page for what's needed.
export function PlaceholderTool({
  icon,
  title,
  description,
  accept,
  dropLabel,
  actionLabel,
  comingSoonNote,
}: PlaceholderToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  function reset() {
    setFile(null);
    setShowNotice(false);
  }

  async function handleProcess() {
    if (!file) return;
    setBusy(true);
    setShowNotice(false);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setBusy(false);
    setShowNotice(true);
  }

  return (
    <ToolShell icon={icon} title={title} description={description}>
      {!file && (
        <Dropzone accept={accept} onFiles={(files) => setFile(files[0] ?? null)} label={dropLabel} />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {showNotice && <ComingSoon note={comingSoonNote} />}

          <MagneticButton onClick={handleProcess} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing…
              </>
            ) : (
              actionLabel
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

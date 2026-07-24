"use client";

import { QrCode, Loader2 } from "lucide-react";
import QRCodeLib from "qrcode";
import { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadBlob } from "@/lib/pdf/download";

export default function QrCodeGeneratorPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!text.trim()) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const id = setTimeout(() => {
      QRCodeLib.toCanvas(canvas, text, { width: 280, margin: 2 }, (err) => {
        setError(err ? "Couldn't generate a QR code for that text." : null);
      });
    }, 200);
    return () => clearTimeout(id);
  }, [text]);

  async function handleDownload() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await QRCodeLib.toDataURL(text, { width: 1024, margin: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      downloadBlob(blob, "qr-code.png");
    } catch {
      setError("Couldn't generate a QR code for that text.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={QrCode}
      title="QR code generator"
      description="Turn any text, link, or contact info into a downloadable QR code."
    >
      <div className="max-w-md space-y-6">
        <div>
          <label htmlFor="qr-text" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
            Text or URL
          </label>
          <textarea
            id="qr-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={3}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div className="flex justify-center rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
          <canvas ref={canvasRef} width={280} height={280} />
        </div>

        {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

        <MagneticButton onClick={handleDownload} disabled={busy || !text.trim()}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            "Download PNG"
          )}
        </MagneticButton>
      </div>

      <PrivacyNote />
    </ToolShell>
  );
}

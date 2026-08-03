"use client";

import { CheckCircle2, Download, FileWarning, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SignaturePad } from "@/components/tools/SignaturePad";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { renderPageToCanvas } from "@/lib/pdf/pdfjs";

const PREVIEW_WIDTH = 640;

type Status = "PENDING" | "SIGNED" | "CANCELLED";

type RequestInfo = {
  fileName: string;
  status: Status;
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  pageWidthPt: number;
  pageHeightPt: number;
};

export default function SignClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<"loading" | "not-found" | "ready" | "already-signed" | "just-signed">("loading");
  const [info, setInfo] = useState<RequestInfo | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/signature-requests/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("not-found");
        return res.json();
      })
      .then((data: RequestInfo) => {
        if (cancelled) return;
        setInfo(data);
        setPhase(data.status === "SIGNED" ? "already-signed" : "ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (phase !== "ready" || !info || !canvasHost.current) return;
    let cancelled = false;
    fetch(`/api/signature-requests/${token}/file`)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        if (cancelled) return;
        const scale = PREVIEW_WIDTH / info.pageWidthPt;
        return renderPageToCanvas(buffer, info.pageIndex + 1, scale);
      })
      .then((canvas) => {
        if (cancelled || !canvas || !canvasHost.current) return;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvasHost.current.replaceChildren(canvas);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, info, token]);

  async function handleSubmit() {
    if (!signatureDataUrl) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/signature-requests/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signaturePng: signatureDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setPhase("just-signed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong signing that document.");
    } finally {
      setSubmitting(false);
    }
  }

  const previewHeight = info ? (PREVIEW_WIDTH / info.pageWidthPt) * info.pageHeightPt : 0;

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-2xl">
        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 py-24 text-brand-brown-dark/60">
            <Loader2 size={28} className="animate-spin" />
            <p>Loading document…</p>
          </div>
        )}

        {phase === "not-found" && (
          <div className="rounded-3xl border border-brand-brown-dark/10 bg-white p-10 text-center">
            <FileWarning size={32} className="mx-auto text-brand-brown-dark/40" />
            <h1 className="mt-4 text-2xl font-bold text-brand-brown-dark">Link not found</h1>
            <p className="mt-2 text-brand-brown-dark/70">
              This signing link doesn&apos;t exist or has expired.
            </p>
          </div>
        )}

        {phase === "already-signed" && info && (
          <div className="rounded-3xl border border-brand-brown-dark/10 bg-white p-10 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-brand-brown-dark">Already signed</h1>
            <p className="mt-2 text-brand-brown-dark/70">
              {info.fileName} has already been signed.
            </p>
            <a
              href={`/api/signature-requests/${token}/file?variant=signed`}
              data-hover="true"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-blue-deep px-6 py-3 text-sm font-semibold text-white"
            >
              <Download size={16} />
              Download signed copy
            </a>
          </div>
        )}

        {phase === "just-signed" && info && (
          <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-10 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-brand-brown-dark">Document signed</h1>
            <p className="mt-2 text-brand-brown-dark/70">
              Thanks — {info.fileName} has been signed.
            </p>
            <a
              href={`/api/signature-requests/${token}/file?variant=signed`}
              data-hover="true"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-blue-deep px-6 py-3 text-sm font-semibold text-white"
            >
              <Download size={16} />
              Download signed copy
            </a>
          </div>
        )}

        {phase === "ready" && info && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-brown-dark sm:text-3xl">Sign {info.fileName}</h1>
              <p className="mt-1 text-brand-brown-dark/70">
                The highlighted box shows where your signature will go.
              </p>
            </div>

            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm"
              style={{ width: PREVIEW_WIDTH, maxWidth: "100%", aspectRatio: `${info.pageWidthPt} / ${info.pageHeightPt}` }}
            >
              <div ref={canvasHost} className="absolute inset-0" />
              <div
                className="pointer-events-none absolute border-2 border-dashed border-brand-blue bg-brand-blue/10"
                style={{
                  left: info.xRatio * PREVIEW_WIDTH,
                  top: info.yRatio * previewHeight,
                  width: info.wRatio * PREVIEW_WIDTH,
                  height: info.hRatio * previewHeight,
                }}
              />
            </div>

            <SignaturePad onCreate={(dataUrl) => setSignatureDataUrl(dataUrl)} />

            {signatureDataUrl && (
              <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-brand-brown-dark">Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signatureDataUrl} alt="Your signature" className="h-16" />
              </div>
            )}

            {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

            <MagneticButton onClick={handleSubmit} disabled={!signatureDataUrl || submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing…
                </>
              ) : (
                "Sign document"
              )}
            </MagneticButton>
          </div>
        )}
      </div>
    </div>
  );
}

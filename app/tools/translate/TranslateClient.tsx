"use client";

import { Languages, Loader2, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { recordToolUsage } from "@/lib/tool-usage-client";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "zh-Hans", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "it", label: "Italian" },
  { code: "ko", label: "Korean" },
];

export default function TranslatePage() {
  const [text, setText] = useState("");
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("hi");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function swap() {
    setSource(target);
    setTarget(source);
    setText(result);
    setResult(text);
  }

  async function handleTranslate() {
    if (!text.trim()) {
      setError("Type something to translate first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source, target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Translation failed.");
        return;
      }
      setResult(data.translatedText);
      recordToolUsage();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Languages}
      title="Language translator"
      description="Translate text between 12 languages — runs on our own server, no third-party API."
    >
      <div className="max-w-2xl space-y-6">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={swap}
            aria-label="Swap languages"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark/70 transition-colors hover:border-brand-blue/40 hover:text-brand-blue-deep"
          >
            <ArrowRightLeft size={15} />
          </button>

          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            maxLength={5000}
            placeholder="Type or paste text here…"
            className="w-full rounded-2xl border border-brand-brown-dark/15 bg-white p-4 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
          <textarea
            readOnly
            value={result}
            rows={8}
            placeholder="Translation appears here…"
            className="w-full rounded-2xl border border-brand-brown-dark/10 bg-brand-cream p-4 text-sm text-brand-brown-dark focus:outline-none"
          />
        </div>

        {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

        <MagneticButton onClick={handleTranslate} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Translating…
            </>
          ) : (
            "Translate"
          )}
        </MagneticButton>
      </div>

      <p className="mt-6 max-w-2xl text-xs text-brand-brown-dark/70">
        Text is sent to our server for translation, then discarded — never stored or logged.
      </p>
    </ToolShell>
  );
}

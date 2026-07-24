"use client";

import { FormInput, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { readFormFields, fillForm, type FormFieldDescriptor } from "@/lib/pdf/fill-form";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function FillPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fields, setFields] = useState<FormFieldDescriptor[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setDone(false);
    try {
      const buf = await f.arrayBuffer();
      const detected = await readFormFields(buf);
      setFile(f);
      setBuffer(buf);
      setFields(detected);
      const initial: Record<string, string | boolean> = {};
      for (const field of detected) {
        initial[field.name] = field.kind === "checkbox" ? field.checked : field.value;
      }
      setValues(initial);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setFields([]);
    setValues({});
    setError(null);
    setDone(false);
  }

  function setValue(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFill() {
    if (!buffer) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const bytes = await fillForm(buffer, values);
      const baseName = file?.name.replace(/\.pdf$/i, "") ?? "form";
      downloadBlob(bytesToBlob(bytes, "application/pdf"), `${baseName}-filled.pdf`);
      setDone(true);
    } catch {
      setError("Something went wrong filling that form.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FormInput}
      title="Fill a PDF form"
      description="Detects fillable fields in a PDF form and lets you fill them right in the browser."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop a PDF form here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {fields.length === 0 ? (
            <p className="text-sm text-brand-brown-dark/70">
              This PDF doesn&apos;t have any fillable form fields.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-semibold text-brand-brown-dark"
                  >
                    {field.name}
                  </label>

                  {field.kind === "text" && (
                    <input
                      id={field.name}
                      value={(values[field.name] as string) ?? ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                      className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
                    />
                  )}

                  {field.kind === "checkbox" && (
                    <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
                      <input
                        id={field.name}
                        type="checkbox"
                        checked={Boolean(values[field.name])}
                        onChange={(e) => setValue(field.name, e.target.checked)}
                        className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
                      />
                      Checked
                    </label>
                  )}

                  {(field.kind === "dropdown" || field.kind === "radio") && (
                    <select
                      id={field.name}
                      value={(values[field.name] as string) ?? ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                      className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
                    >
                      <option value="">— Select —</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">Filled PDF downloaded.</p>
          )}

          {fields.length > 0 && (
            <MagneticButton onClick={handleFill} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Filling…
                </>
              ) : (
                "Fill & download"
              )}
            </MagneticButton>
          )}
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

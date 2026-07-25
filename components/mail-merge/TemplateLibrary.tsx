"use client";

import { Copy, FileText, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  isBuiltIn: boolean;
  userId: string | null;
};

export function TemplateLibrary({
  currentSubject,
  currentBody,
  onApply,
}: {
  currentSubject: string;
  currentBody: string;
  onApply: (subject: string, body: string) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/mail-merge/templates")
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function handleSave() {
    if (!saveName.trim()) return;
    const res = await fetch("/api/mail-merge/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saveName, subject: currentSubject, body: currentBody }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Couldn't save template.");
      return;
    }
    setSaveName("");
    setMessage("Template saved.");
    load();
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/mail-merge/templates/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Couldn't duplicate template.");
      return;
    }
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/mail-merge/templates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-bold text-brand-brown-dark"
      >
        <span className="flex items-center gap-2">
          <FileText size={16} className="text-brand-blue-deep" />
          Email templates
        </span>
        <span className="text-xs font-normal text-brand-brown-dark/70">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-brand-brown-dark/10 px-3 py-2 text-sm"
              >
                <button
                  type="button"
                  onClick={() => onApply(t.subject, t.body)}
                  className="flex-1 truncate text-left text-brand-brown-dark hover:text-brand-blue-deep"
                >
                  {t.name}
                  {t.isBuiltIn && (
                    <span className="ml-2 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-semibold text-brand-blue-deep">
                      Built-in
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  title="Duplicate"
                  onClick={() => handleDuplicate(t.id)}
                  className="text-brand-brown-dark/70 hover:text-brand-blue-deep"
                >
                  <Copy size={14} />
                </button>
                {!t.isBuiltIn && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => handleDelete(t.id)}
                    className="text-brand-brown-dark/70 hover:text-status-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-brand-brown-dark/10 pt-4">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Save current draft as…"
              className="flex-1 rounded-full border border-brand-brown-dark/15 px-4 py-2 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
            />
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-full bg-brand-blue-deep px-4 py-2 text-xs font-semibold text-white"
            >
              <Save size={13} />
              Save
            </button>
          </div>
          {message && <p className="text-xs text-brand-brown-dark/70">{message}</p>}
        </div>
      )}
    </div>
  );
}

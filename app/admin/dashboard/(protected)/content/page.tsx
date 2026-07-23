"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CONTENT_SLUGS, type ContentSlug } from "@/lib/content-pages";

const LABELS: Record<ContentSlug, string> = {
  faq: "FAQ",
  "privacy-policy": "Privacy Policy",
  terms: "Terms & Conditions",
  contact: "Contact Information",
  about: "About Us",
};

export default function AdminContentPage() {
  const [active, setActive] = useState<ContentSlug>("faq");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin-dashboard/content/${active}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.page?.title || "");
        setBody(data.page?.body || "");
      })
      .finally(() => setLoading(false));
  }, [active]);

  function selectTab(slug: ContentSlug) {
    setLoading(true);
    setMessage(null);
    setActive(slug);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin-dashboard/content/${active}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      setMessage(res.ok ? "Saved." : data.error || "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark">Content</h1>
      <p className="mt-2 text-brand-brown-dark/60">
        Edit the pages linked from the footer.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CONTENT_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            data-hover="true"
            onClick={() => selectTab(slug)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === slug
                ? "bg-brand-blue-deep text-white"
                : "bg-white text-brand-brown-dark/60 hover:text-brand-brown-dark"
            }`}
          >
            {LABELS[slug]}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-2xl rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-brand-brown-dark/60">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-brown-dark">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full rounded-2xl border border-brand-brown-dark/15 px-5 py-4 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
              <p className="mt-1.5 text-xs text-brand-brown-dark/45">
                Plain text — separate paragraphs with a blank line.
              </p>
            </div>

            {message && <p className="text-sm font-medium text-brand-blue-deep">{message}</p>}

            <button
              type="button"
              data-hover="true"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-full bg-brand-blue-deep px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

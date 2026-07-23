"use client";

import { ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import { useState } from "react";
import { renderTemplate, findField, maskSensitiveFields } from "@/lib/mail-merge/render-template";

type Recipient = { email: string; fields: Record<string, string> };

export function EmailPreview({
  recipients,
  subjectTemplate,
  bodyTemplate,
  attachmentNames,
}: {
  recipients: Recipient[];
  subjectTemplate: string;
  bodyTemplate: string;
  attachmentNames: string[];
}) {
  const [index, setIndex] = useState(0);
  const recipient = recipients[index];
  if (!recipient) return null;

  const cc = findField(recipient.fields, "cc");
  const bcc = findField(recipient.fields, "bcc");
  const pdfPassword = findField(recipient.fields, "pdf password");
  const masked = maskSensitiveFields(recipient.fields);

  return (
    <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-brand-brown-dark">
          Preview {index + 1} of {recipients.length}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            aria-label="Previous recipient"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            disabled={index === recipients.length - 1}
            onClick={() => setIndex((i) => i + 1)}
            aria-label="Next recipient"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-brand-brown-dark/45">To</dt>
          <dd className="text-brand-brown-dark">{recipient.email}</dd>
        </div>
        {cc && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-brand-brown-dark/45">CC</dt>
            <dd className="text-brand-brown-dark">{cc}</dd>
          </div>
        )}
        {bcc && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-brand-brown-dark/45">BCC</dt>
            <dd className="text-brand-brown-dark">{bcc}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-brand-brown-dark/45">Subject</dt>
          <dd className="font-semibold text-brand-brown-dark">
            {renderTemplate(subjectTemplate, recipient.fields)}
          </dd>
        </div>
        {pdfPassword && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-brand-brown-dark/45">PDF pwd</dt>
            <dd className="text-brand-brown-dark">{masked["PDF Password"] ?? "••••••"}</dd>
          </div>
        )}
      </dl>

      {attachmentNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachmentNames.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs text-brand-brown-dark/70"
            >
              <Paperclip size={11} />
              {name}
            </span>
          ))}
        </div>
      )}

      <div
        className="prose prose-sm mt-4 max-w-none rounded-xl border border-brand-brown-dark/10 bg-brand-cream/30 p-4"
        dangerouslySetInnerHTML={{ __html: renderTemplate(bodyTemplate, recipient.fields) }}
      />
    </div>
  );
}

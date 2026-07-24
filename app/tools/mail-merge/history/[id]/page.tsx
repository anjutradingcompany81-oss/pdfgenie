"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { use, useEffect, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { DeliveryDashboard, type RecipientLike } from "@/components/mail-merge/DeliveryDashboard";
import { FailedEmailReport } from "@/components/mail-merge/FailedEmailReport";

type Job = {
  id: string;
  status: string;
  subject: string;
  senderEmail: string | null;
  recipientCount: number;
  createdAt: string;
  completedAt: string | null;
};

type Recipient = RecipientLike & { id: string; email: string; error: string | null };

const LOG_FORMATS = ["xlsx", "csv", "pdf", "json"] as const;

export default function MailMergeJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch(`/api/mail-merge/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data.job);
        setRecipients(data.recipients || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function reloadAfterRetry() {
    setLoading(true);
    load();
  }

  if (loading) {
    return (
      <ToolShell icon={FileText} title="Job details" description="">
        <Loader2 size={20} className="animate-spin text-brand-brown-dark/70" />
      </ToolShell>
    );
  }

  if (!job) {
    return (
      <ToolShell icon={FileText} title="Job not found" description="">
        <p className="text-sm text-brand-brown-dark/70">
          This job doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </ToolShell>
    );
  }

  const failedRecipients = recipients.filter((r) => r.status === "FAILED");

  return (
    <ToolShell icon={FileText} title={job.subject} description={`Job ${job.id}`}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {LOG_FORMATS.map((format) => (
            <a
              key={format}
              href={`/api/mail-merge/jobs/${id}/log?format=${format}`}
              className="flex items-center gap-1.5 rounded-full border border-brand-brown-dark/15 px-4 py-2 text-xs font-semibold text-brand-brown-dark hover:border-brand-blue/40"
            >
              <Download size={13} />
              Log ({format.toUpperCase()})
            </a>
          ))}
        </div>

        <DeliveryDashboard recipients={recipients} createdAt={job.createdAt} completedAt={job.completedAt} />

        <FailedEmailReport jobId={id} failedRecipients={failedRecipients} onRetried={reloadAfterRetry} />
      </div>
    </ToolShell>
  );
}

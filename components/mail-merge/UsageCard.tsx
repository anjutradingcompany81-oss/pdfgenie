"use client";

import { Gauge } from "lucide-react";
import { useEffect, useState } from "react";

type Usage = {
  plan: string;
  emailsSentToday: number;
  maxEmailsPerDay: number;
  remainingToday: number;
  unlimited: boolean;
  emailsSentThisMonth: number;
  currentJobEmailCount: number;
  maxEmailsPerJob: number;
};

export function UsageCard({ refreshKey }: { refreshKey: number }) {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    fetch("/api/mail-merge/usage")
      .then((res) => res.json())
      .then(setUsage)
      .catch(() => {});
  }, [refreshKey]);

  if (!usage) return null;

  return (
    <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <div className="flex items-center gap-2">
        <Gauge size={16} className="text-brand-blue-deep" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-brand-brown-dark">
          {usage.plan === "FREE" ? "Free Plan Usage" : `${usage.plan} Plan Usage`}
        </h3>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm text-brand-brown-dark/75">
        <div className="flex justify-between">
          <dt>Emails sent today</dt>
          <dd className="font-semibold text-brand-brown-dark">
            {usage.unlimited ? usage.emailsSentToday : `${usage.emailsSentToday} / ${usage.maxEmailsPerDay}`}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Remaining today</dt>
          <dd className="font-semibold text-brand-brown-dark">
            {usage.unlimited ? "Unlimited" : usage.remainingToday}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Emails sent this month</dt>
          <dd className="font-semibold text-brand-brown-dark">{usage.emailsSentThisMonth}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Last job</dt>
          <dd className="font-semibold text-brand-brown-dark">
            {usage.currentJobEmailCount} / {usage.maxEmailsPerJob === -1 ? "∞" : usage.maxEmailsPerJob} emails
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Plan</dt>
          <dd className="font-semibold text-brand-brown-dark">
            {usage.plan.charAt(0) + usage.plan.slice(1).toLowerCase()}
          </dd>
        </div>
      </dl>
    </div>
  );
}

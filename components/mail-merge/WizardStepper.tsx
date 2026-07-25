"use client";

import { Check } from "lucide-react";

export type WizardStepId = "recipients" | "attachments" | "composer" | "preview";

const STEPS: { id: WizardStepId; label: string }[] = [
  { id: "recipients", label: "Recipients" },
  { id: "attachments", label: "Attachments" },
  { id: "composer", label: "Compose" },
  { id: "preview", label: "Preview" },
];

export function WizardStepper({ current }: { current: WizardStepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex shrink-0 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-status-success text-white"
                    : isCurrent
                      ? "bg-brand-blue-deep text-white"
                      : "bg-brand-brown-dark/10 text-brand-brown-dark/45"
                }`}
              >
                {isDone ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`hidden text-xs font-semibold sm:inline ${
                  isDone ? "text-status-success" : isCurrent ? "text-brand-blue-deep" : "text-brand-brown-dark/45"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-px flex-1 ${isDone ? "bg-status-success" : "bg-brand-brown-dark/10"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

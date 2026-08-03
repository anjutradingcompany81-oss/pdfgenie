"use client";

import { Check } from "lucide-react";

export type TaxStepId = "profile" | "ctc" | "declarations" | "results";

const STEPS: { id: TaxStepId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "ctc", label: "CTC Structure" },
  { id: "declarations", label: "Declarations" },
  { id: "results", label: "Results" },
];

export function TaxStepper({ current, onJump }: { current: TaxStepId; onJump: (step: TaxStepId) => void }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <button
              type="button"
              data-hover="true"
              disabled={i > currentIndex}
              onClick={() => onJump(step.id)}
              className={`flex shrink-0 items-center gap-2 ${i > currentIndex ? "cursor-not-allowed" : ""}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-status-success text-white"
                    : isCurrent
                      ? "bg-brand-blue-deep text-white"
                      : "bg-brand-brown-dark/10 text-brand-brown-dark/45"
                }`}
              >
                {isDone ? <Check size={14} /> : i + 1}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:inline ${
                  isDone ? "text-status-success" : isCurrent ? "text-brand-blue-deep" : "text-brand-brown-dark/45"
                }`}
              >
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && <div className={`mx-3 h-px flex-1 ${isDone ? "bg-status-success" : "bg-brand-brown-dark/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

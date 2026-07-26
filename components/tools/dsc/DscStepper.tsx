"use client";

import { Check } from "lucide-react";

export const DSC_STEPS = [
  "Upload",
  "Certificate",
  "Placement",
  "Pages",
  "Appearance",
  "Details",
  "Security",
  "Preview",
  "Sign",
] as const;

export function DscStepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center overflow-x-auto pb-1">
      {DSC_STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <li key={label} className={`flex shrink-0 items-center ${i < DSC_STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex shrink-0 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone ? "bg-status-success text-white" : isCurrent ? "bg-dsc-primary text-white" : "bg-dsc-border text-dsc-ink-muted"
                }`}
              >
                {isDone ? <Check size={13} /> : step}
              </div>
              <span className={`hidden text-xs font-semibold sm:inline ${isDone ? "text-status-success" : isCurrent ? "text-dsc-primary" : "text-dsc-ink-muted"}`}>
                {label}
              </span>
            </div>
            {i < DSC_STEPS.length - 1 && <div className={`mx-2 h-px min-w-6 flex-1 ${isDone ? "bg-status-success" : "bg-dsc-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

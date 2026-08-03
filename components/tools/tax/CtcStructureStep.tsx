"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import type { CtcStructureInput, CtcBreakdown, ReimbursementComponent } from "@/lib/tax/engine";
import { formatINR } from "@/lib/tax/format";
import { NumberField, SectionCard, ToggleRow, CheckboxRow, PercentAmountField } from "./shared";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function CtcStructureStep({
  ctc,
  breakdown,
  onChange,
}: {
  ctc: CtcStructureInput;
  breakdown: CtcBreakdown;
  onChange: (ctc: CtcStructureInput) => void;
}) {
  function updateReimbursement(key: ReimbursementComponent["key"], patch: Partial<ReimbursementComponent>) {
    onChange({
      ...ctc,
      reimbursements: ctc.reimbursements.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    });
  }

  const carReimbursement = ctc.reimbursements.find((r) => r.key === "car");

  const basicPercent = ctc.totalAnnualCtc > 0 ? round2((breakdown.basic / ctc.totalAnnualCtc) * 100) : ctc.basicPercentOfCtc;
  const hraPercent = breakdown.basic > 0 ? round2((breakdown.hra / breakdown.basic) * 100) : ctc.hraPercentOfBasic;
  const employerNpsPercent = breakdown.basic > 0 ? round2((breakdown.employerNps / breakdown.basic) * 100) : ctc.employerNpsPercentOfBasic;

  return (
    <div className="space-y-5">
      <SectionCard title="Total CTC" description="Every component below is carved out of this figure. Special Allowance always absorbs the balance.">
        <NumberField label="Total annual CTC" value={ctc.totalAnnualCtc} onChange={(v) => onChange({ ...ctc, totalAnnualCtc: v })} suffix="₹ / year" />
      </SectionCard>

      <SectionCard title="Fixed components">
        <div className="grid gap-4 sm:grid-cols-2">
          <PercentAmountField
            label="Basic Salary"
            percent={basicPercent}
            amount={breakdown.basic}
            onPercentChange={(v) => onChange({ ...ctc, basicPercentOfCtc: v, basicOverride: null })}
            onAmountChange={(v) => onChange({ ...ctc, basicOverride: v })}
          />
          <PercentAmountField
            label="HRA"
            percent={hraPercent}
            amount={breakdown.hra}
            onPercentChange={(v) => onChange({ ...ctc, hraPercentOfBasic: v, hraOverride: null })}
            onAmountChange={(v) => onChange({ ...ctc, hraOverride: v })}
          />
          <NumberField label="Variable Pay (annual)" value={ctc.variablePay} onChange={(v) => onChange({ ...ctc, variablePay: v })} />
          <NumberField label="Bonus (annual)" value={ctc.bonus} onChange={(v) => onChange({ ...ctc, bonus: v })} />
          <NumberField label="Dearness Allowance (annual)" value={ctc.dearnessAllowance} onChange={(v) => onChange({ ...ctc, dearnessAllowance: v })} />
          <NumberField label="Other Allowance (annual)" value={ctc.otherAllowance} onChange={(v) => onChange({ ...ctc, otherAllowance: v })} />
        </div>
      </SectionCard>

      <SectionCard title="Reimbursements" description="Nothing here is assumed tax-exempt — enable only what applies, and declare eligible exempt amounts in the next step.">
        <div className="space-y-3">
          {ctc.reimbursements.map((r) => (
            <ToggleRow
              key={r.key}
              label={r.label}
              enabled={r.enabled}
              onToggle={(enabled) => updateReimbursement(r.key, { enabled })}
              description={r.key === "car" && carReimbursement ? `Grade-based eligibility: ${formatINR(breakdown.carGradeEligibility)}/year` : undefined}
            >
              <NumberField label="Annual amount" value={r.annualAmount} onChange={(v) => updateReimbursement(r.key, { annualAmount: v })} />
              {r.key === "car" && (
                <button
                  type="button"
                  data-hover="true"
                  onClick={() => updateReimbursement("car", { annualAmount: breakdown.carGradeEligibility })}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-blue-deep hover:underline"
                >
                  <RotateCcw size={12} />
                  Use grade eligibility ({formatINR(breakdown.carGradeEligibility)})
                </button>
              )}
            </ToggleRow>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-brand-brown-dark/70">
          Reimbursements total: {formatINR(breakdown.reimbursementsTotal)}
        </p>
      </SectionCard>

      <SectionCard title="Retiral benefits" description="Employer cost — not paid to you as cash, but forms part of CTC.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <CheckboxRow
              label="Compute employer & employee PF on full Basic (uncheck to cap at the ₹15,000/month statutory wage ceiling)"
              checked={ctc.pfOnFullBasic}
              onChange={(checked) => onChange({ ...ctc, pfOnFullBasic: checked })}
            />
          </div>
          <NumberField
            label="Employer PF override (optional)"
            value={ctc.employerPfOverride ?? breakdown.employerPf}
            onChange={(v) => onChange({ ...ctc, employerPfOverride: v })}
            hint={`Default: 12% of Basic = ${formatINR(breakdown.employerPf)}`}
          />
          <NumberField
            label="Gratuity override (optional)"
            value={ctc.gratuityOverride ?? breakdown.gratuity}
            onChange={(v) => onChange({ ...ctc, gratuityOverride: v })}
            hint={`Default: 4.81% of Basic = ${formatINR(breakdown.gratuity)}`}
          />
          <PercentAmountField
            label="Employer NPS"
            percent={employerNpsPercent}
            amount={breakdown.employerNps}
            onPercentChange={(v) => onChange({ ...ctc, employerNpsPercentOfBasic: v, employerNpsOverride: null })}
            onAmountChange={(v) => onChange({ ...ctc, employerNpsOverride: v })}
          />
          <NumberField label="Superannuation (annual)" value={ctc.superannuation} onChange={(v) => onChange({ ...ctc, superannuation: v })} />
        </div>
        {breakdown.taxableExcessRetirals > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Employer PF + NPS + Superannuation total {formatINR(breakdown.totalEmployerRetirals)}, exceeding the ₹7,50,000 combined
            threshold — {formatINR(breakdown.taxableExcessRetirals)} is added back as a taxable perquisite.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Other employer cost" description="Insurance and similar costs — part of CTC, not part of gross salary or take-home.">
        <NumberField label="Group insurance & other employer cost (annual)" value={ctc.otherEmployerCost} onChange={(v) => onChange({ ...ctc, otherEmployerCost: v })} />
      </SectionCard>

      <div
        className={`rounded-3xl border p-5 ${
          breakdown.isBalanced ? "border-emerald-500/25 bg-emerald-500/5" : "border-status-danger/30 bg-status-danger/5"
        }`}
      >
        <p className="text-sm font-semibold text-brand-brown-dark">Special Allowance (auto-balances CTC)</p>
        <p className={`mt-1 text-2xl font-bold ${breakdown.isBalanced ? "text-emerald-700" : "text-status-danger"}`}>
          {formatINR(Math.max(0, breakdown.specialAllowance))}
        </p>
        {!breakdown.isBalanced && (
          <p className="mt-2 flex items-start gap-2 text-sm text-status-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            The structure exceeds CTC by {formatINR(Math.abs(breakdown.shortfallOrExcess))}. Reduce an optional
            reimbursement or retiral, lower the Basic/HRA percentage, or increase total CTC.
          </p>
        )}
      </div>
    </div>
  );
}

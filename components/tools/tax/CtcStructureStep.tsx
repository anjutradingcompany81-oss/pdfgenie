"use client";

import { useState } from "react";
import { AlertTriangle, Plus, RotateCcw, X } from "lucide-react";
import {
  DYNAMIC_COMPONENT_PRESETS,
  createDynamicComponentId,
  type CtcStructureInput,
  type CtcBreakdown,
  type DynamicComponentCategory,
} from "@/lib/tax/engine";
import { formatINR } from "@/lib/tax/format";
import { NumberField, SectionCard, ToggleRow, NumericInput } from "./shared";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function CtcTableRow({
  label,
  hint,
  onQuickFill,
  percent,
  percentBase,
  amount,
  onPercentChange,
  onAmountChange,
  onRemove,
}: {
  label: string;
  hint?: string;
  onQuickFill?: () => void;
  percent: number;
  percentBase: "CTC" | "Basic";
  amount: number;
  onPercentChange: (v: number) => void;
  onAmountChange: (v: number) => void;
  onRemove?: () => void;
}) {
  return (
    <tr className="border-b border-brand-brown-dark/5 last:border-0">
      <td className="py-2 pr-3 align-top">
        <p className="text-sm font-medium text-brand-brown-dark">{label}</p>
        {hint && (
          <button
            type="button"
            data-hover="true"
            onClick={onQuickFill}
            disabled={!onQuickFill}
            className={`text-left text-[11px] text-brand-brown-dark/50 ${onQuickFill ? "flex items-center gap-1 hover:text-brand-blue-deep hover:underline" : ""}`}
          >
            {onQuickFill && <RotateCcw size={10} />}
            {hint}
          </button>
        )}
      </td>
      <td className="py-2 pr-2 align-top">
        <div className="flex flex-col items-end">
          <NumericInput
            value={percent}
            onChange={onPercentChange}
            min={0}
            ariaLabel={`${label} — percent`}
            className="w-16 rounded-lg border border-brand-brown-dark/15 bg-white px-2 py-1.5 text-right text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
          <span className="mt-0.5 text-[10px] text-brand-brown-dark/40">% of {percentBase}</span>
        </div>
      </td>
      <td className="py-2 pr-2 align-top">
        <NumericInput
          value={amount}
          onChange={onAmountChange}
          min={0}
          ariaLabel={`${label} — amount`}
          className="w-28 rounded-lg border border-brand-brown-dark/15 bg-white px-2 py-1.5 text-right text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
        />
      </td>
      <td className="w-8 py-2 align-top">
        {onRemove && (
          <button
            type="button"
            data-hover="true"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="flex h-7 w-7 items-center justify-center rounded-full text-brand-brown-dark/40 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
          >
            <X size={14} />
          </button>
        )}
      </td>
    </tr>
  );
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
  const [presetToAdd, setPresetToAdd] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const basicPercent = ctc.totalAnnualCtc > 0 ? round2((breakdown.basic / ctc.totalAnnualCtc) * 100) : ctc.basicPercentOfCtc;
  const hraPercent = breakdown.basic > 0 ? round2((breakdown.hra / breakdown.basic) * 100) : ctc.hraPercentOfBasic;
  const employerPfPercent = breakdown.basic > 0 ? round2((breakdown.employerPf / breakdown.basic) * 100) : ctc.employerPfPercentOfBasic;
  const gratuityPercent = breakdown.basic > 0 ? round2((breakdown.gratuity / breakdown.basic) * 100) : ctc.gratuityPercentOfBasic;
  const employerNpsPercent = breakdown.basic > 0 ? round2((breakdown.employerNps / breakdown.basic) * 100) : ctc.employerNpsPercentOfBasic;
  const carPercent = ctc.totalAnnualCtc > 0 ? round2((breakdown.car / ctc.totalAnnualCtc) * 100) : ctc.carPercentOfCtc;
  const ltaPercent = breakdown.basic > 0 ? round2((breakdown.lta / breakdown.basic) * 100) : ctc.ltaPercentOfBasic;

  const addedLabels = new Set(ctc.dynamicComponents.map((c) => c.label));
  const availablePresets = DYNAMIC_COMPONENT_PRESETS.filter((p) => !addedLabels.has(p.label));

  function addComponent() {
    const isCustom = presetToAdd === "__custom__";
    const label = isCustom ? customLabel.trim() : presetToAdd;
    if (!label) return;
    const preset = DYNAMIC_COMPONENT_PRESETS.find((p) => p.label === presetToAdd);
    const category: DynamicComponentCategory = isCustom ? "OTHER" : (preset?.category ?? "OTHER");
    onChange({
      ...ctc,
      dynamicComponents: [...ctc.dynamicComponents, { id: createDynamicComponentId(), label, category, percentOfCtc: 0, amountOverride: null }],
    });
    setPresetToAdd("");
    setCustomLabel("");
  }

  function removeComponent(id: string) {
    onChange({ ...ctc, dynamicComponents: ctc.dynamicComponents.filter((c) => c.id !== id) });
  }

  function updateComponent(id: string, patch: { percentOfCtc?: number; amountOverride?: number | null }) {
    onChange({
      ...ctc,
      dynamicComponents: ctc.dynamicComponents.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Total CTC" description="Every row below is carved out of this figure. Special Allowance always absorbs the balance.">
        <NumberField label="Total annual CTC" value={ctc.totalAnnualCtc} onChange={(v) => onChange({ ...ctc, totalAnnualCtc: v })} suffix="₹ / year" />
      </SectionCard>

      <SectionCard title="CTC structure" description="Basic, HRA, PF, Gratuity, NPS, Car Allowance, and LTA are always present. Add anything else you need below.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-brand-brown-dark/45">
                <th className="pb-2 pr-3 font-semibold">Component</th>
                <th className="pb-2 pr-2 text-right font-semibold">%</th>
                <th className="pb-2 pr-2 text-right font-semibold">Amount (₹)</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              <CtcTableRow
                label="Basic Salary"
                percent={basicPercent}
                percentBase="CTC"
                amount={breakdown.basic}
                onPercentChange={(v) => onChange({ ...ctc, basicPercentOfCtc: v, basicOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, basicOverride: v })}
              />
              <CtcTableRow
                label="HRA"
                percent={hraPercent}
                percentBase="Basic"
                amount={breakdown.hra}
                onPercentChange={(v) => onChange({ ...ctc, hraPercentOfBasic: v, hraOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, hraOverride: v })}
              />
              <CtcTableRow
                label="Employer PF"
                percent={employerPfPercent}
                percentBase="Basic"
                amount={breakdown.employerPf}
                onPercentChange={(v) => onChange({ ...ctc, employerPfPercentOfBasic: v, employerPfOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, employerPfOverride: v })}
              />
              <CtcTableRow
                label="Gratuity"
                percent={gratuityPercent}
                percentBase="Basic"
                amount={breakdown.gratuity}
                onPercentChange={(v) => onChange({ ...ctc, gratuityPercentOfBasic: v, gratuityOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, gratuityOverride: v })}
              />
              <CtcTableRow
                label="Employer NPS"
                percent={employerNpsPercent}
                percentBase="Basic"
                amount={breakdown.employerNps}
                onPercentChange={(v) => onChange({ ...ctc, employerNpsPercentOfBasic: v, employerNpsOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, employerNpsOverride: v })}
              />
              <CtcTableRow
                label="Car Allowance"
                hint={`Use grade eligibility (${formatINR(breakdown.carGradeEligibility)}/yr)`}
                onQuickFill={() => onChange({ ...ctc, carOverride: breakdown.carGradeEligibility })}
                percent={carPercent}
                percentBase="CTC"
                amount={breakdown.car}
                onPercentChange={(v) => onChange({ ...ctc, carPercentOfCtc: v, carOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, carOverride: v })}
              />
              <CtcTableRow
                label="LTA"
                percent={ltaPercent}
                percentBase="Basic"
                amount={breakdown.lta}
                onPercentChange={(v) => onChange({ ...ctc, ltaPercentOfBasic: v, ltaOverride: null })}
                onAmountChange={(v) => onChange({ ...ctc, ltaOverride: v })}
              />

              {breakdown.dynamicComponents.map((resolved) => {
                const source = ctc.dynamicComponents.find((c) => c.id === resolved.id);
                const percent = ctc.totalAnnualCtc > 0 ? round2((resolved.amount / ctc.totalAnnualCtc) * 100) : (source?.percentOfCtc ?? 0);
                return (
                  <CtcTableRow
                    key={resolved.id}
                    label={resolved.label}
                    percent={percent}
                    percentBase="CTC"
                    amount={resolved.amount}
                    onPercentChange={(v) => updateComponent(resolved.id, { percentOfCtc: v, amountOverride: null })}
                    onAmountChange={(v) => updateComponent(resolved.id, { amountOverride: v })}
                    onRemove={() => removeComponent(resolved.id)}
                  />
                );
              })}

              <tr className={`border-t border-brand-brown-dark/10 ${breakdown.isBalanced ? "bg-emerald-500/5" : "bg-status-danger/5"}`}>
                <td className="py-2 pr-3">
                  <p className="text-sm font-semibold text-brand-brown-dark">Special Allowance</p>
                  <p className="text-[11px] text-brand-brown-dark/50">Balancing figure — not directly editable</p>
                </td>
                <td></td>
                <td className={`py-2 pr-2 text-right text-sm font-bold ${breakdown.isBalanced ? "text-emerald-700" : "text-status-danger"}`}>
                  {formatINR(Math.max(0, breakdown.specialAllowance))}
                </td>
                <td></td>
              </tr>
              <tr className="border-t-2 border-brand-brown-dark/20">
                <td className="py-2 pr-3 text-sm font-bold text-brand-brown-dark">Total CTC</td>
                <td></td>
                <td className="py-2 pr-2 text-right text-sm font-bold text-brand-brown-dark">{formatINR(breakdown.totalAnnualCtc)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {!breakdown.isBalanced && (
          <p className="mt-3 flex items-start gap-2 text-sm text-status-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            The structure exceeds CTC by {formatINR(Math.abs(breakdown.shortfallOrExcess))}. Reduce a component or increase total CTC.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-brand-brown-dark/10 pt-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-brand-brown-dark">Add a component</label>
            <select
              value={presetToAdd}
              onChange={(e) => setPresetToAdd(e.target.value)}
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
            >
              <option value="">Choose a component…</option>
              {availablePresets.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
              <option value="__custom__">Custom component…</option>
            </select>
          </div>
          {presetToAdd === "__custom__" && (
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Component name"
              className="min-w-[160px] flex-1 rounded-full border border-brand-brown-dark/15 bg-white px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
            />
          )}
          <button
            type="button"
            data-hover="true"
            onClick={addComponent}
            disabled={!presetToAdd || (presetToAdd === "__custom__" && !customLabel.trim())}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue-deep px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </SectionCard>

      <SectionCard title="PF settings">
        <ToggleRow
          label="Compute employer & employee PF on full Basic"
          description="Uncheck to cap the PF wage base at the ₹15,000/month statutory ceiling instead."
          enabled={ctc.pfOnFullBasic}
          onToggle={(checked) => onChange({ ...ctc, pfOnFullBasic: checked })}
        />
        {breakdown.taxableExcessRetirals > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Employer PF + NPS + retiral components total {formatINR(breakdown.employerPf + breakdown.employerNps + breakdown.dynamicComponents.filter((c) => c.category === "RETIRAL").reduce((s, c) => s + c.amount, 0))}
            , exceeding the ₹7,50,000 combined threshold — {formatINR(breakdown.taxableExcessRetirals)} is added back as a taxable perquisite.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

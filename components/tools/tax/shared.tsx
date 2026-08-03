"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { CtcBreakdown } from "@/lib/tax/engine";

// Native <input type="number"> doesn't strip a leading zero while you're
// still typing (e.g. "0" then "2000000" stays "02000000" until blur in most
// browsers), and a controlled numeric value can fight the caret mid-keystroke.
// NumericInput sidesteps both: it's a text input that only shows the
// prop-derived value while unfocused, and cleans (strips non-digits, extra
// dots, leading zeros) on every keystroke while focused.
function cleanNumericInput(raw: string): string {
  let s = raw.replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  s = s.replace(/^0+(?=\d)/, "");
  return s;
}

export function NumericInput({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
  className: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  // While focused, the input shows the locally-buffered raw text (so a
  // leading zero can be typed through without the browser/React fighting
  // the caret). Once blurred, it always shows the canonical prop value.
  const displayValue = focused ? text : String(Number.isFinite(value) ? value : 0);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      aria-label={ariaLabel}
      onFocus={() => {
        setText(String(Number.isFinite(value) ? value : 0));
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const cleaned = cleanNumericInput(e.target.value);
        setText(cleaned);
        let parsed = cleaned === "" || cleaned === "." ? 0 : Number(cleaned);
        if (!Number.isFinite(parsed)) parsed = 0;
        if (min !== undefined) parsed = Math.max(min, parsed);
        if (max !== undefined) parsed = Math.min(max, parsed);
        onChange(parsed);
      }}
      className={className}
    />
  );
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-brand-brown-dark/10 bg-white p-5 sm:p-6">
      <h3 className="text-base font-bold text-brand-brown-dark">{title}</h3>
      {description && <p className="mt-1 text-sm text-brand-brown-dark/65">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">{label}</span>
      <div className="relative">
        <NumericInput
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          ariaLabel={label}
          className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-brown-dark/50">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-brand-brown-dark/55">{hint}</span>}
    </label>
  );
}

export function PercentAmountField({
  label,
  percent,
  amount,
  onPercentChange,
  onAmountChange,
  hint,
}: {
  label: string;
  percent: number;
  amount: number;
  onPercentChange: (value: number) => void;
  onAmountChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <NumericInput
            value={percent}
            onChange={onPercentChange}
            min={0}
            ariaLabel={`${label} — percent`}
            className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-brown-dark/50">%</span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-brown-dark/50">₹</span>
          <NumericInput
            value={amount}
            onChange={onAmountChange}
            min={0}
            ariaLabel={`${label} — amount`}
            className="w-full rounded-full border border-brand-brown-dark/15 bg-white py-3 pl-8 pr-5 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
        </div>
      </div>
      {hint && <span className="mt-1 block text-xs text-brand-brown-dark/55">{hint}</span>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-brown-dark/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-brown-dark">{label}</p>
          {description && <p className="text-xs text-brand-brown-dark/55">{description}</p>}
        </div>
        <button
          type="button"
          data-hover="true"
          role="switch"
          aria-checked={enabled}
          aria-label={`Toggle ${label}`}
          onClick={() => onToggle(!enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-brand-blue-deep" : "bg-brand-brown-dark/15"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      </div>
      {enabled && children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-brown-dark">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-brand-brown-dark/30 text-brand-blue-deep focus:ring-brand-blue"
      />
      {label}
    </label>
  );
}

const DONUT_COLORS = ["#2563eb", "#0d9488", "#f59e0b", "#a855f7", "#ec4899", "#64748b"];

export function DonutChart({ segments, size = 160 }: { segments: { label: string; value: number }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-brand-brown-dark/10" strokeWidth={16} />
        {total > 0 &&
          segments.map((seg, i) => {
            if (seg.value <= 0) return null;
            const fraction = seg.value / total;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={16}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {segments
          .filter((s) => s.value > 0)
          .map((seg, i) => (
            <li key={seg.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="text-brand-brown-dark/70">{seg.label}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function CompareBar({ label, valueA, valueB, labelA, labelB, format }: {
  label: string;
  valueA: number;
  valueB: number;
  labelA: string;
  labelB: string;
  format: (n: number) => string;
}) {
  const max = Math.max(valueA, valueB, 1);
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-brand-brown-dark/70">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[11px] text-brand-brown-dark/55">{labelA}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-brown-dark/5">
            <div className="h-full rounded-full bg-brand-blue" style={{ width: `${(valueA / max) * 100}%` }} />
          </div>
          <span className="w-24 shrink-0 text-right text-[11px] font-semibold text-brand-brown-dark">{format(valueA)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[11px] text-brand-brown-dark/55">{labelB}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-brown-dark/5">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(valueB / max) * 100}%` }} />
          </div>
          <span className="w-24 shrink-0 text-right text-[11px] font-semibold text-brand-brown-dark">{format(valueB)}</span>
        </div>
      </div>
    </div>
  );
}

export type BifurcationRow = { label: string; amount: number };
export type BifurcationSection = { title: string; rows: BifurcationRow[] };

export function buildCtcBifurcationSections(ctc: CtcBreakdown): BifurcationSection[] {
  const dynamicByCategory = (category: "FIXED" | "REIMBURSEMENT" | "RETIRAL" | "OTHER") =>
    ctc.dynamicComponents.filter((c) => c.category === category && c.amount > 0).map((c) => ({ label: c.label, amount: c.amount }));

  return [
    {
      title: "Fixed components",
      rows: [
        { label: "Basic Salary", amount: ctc.basic },
        { label: "HRA", amount: ctc.hra },
        { label: "Special Allowance", amount: Math.max(0, ctc.specialAllowance) },
        ...dynamicByCategory("FIXED"),
      ],
    },
    {
      title: "Reimbursements & allowances",
      rows: [
        ...(ctc.car > 0 ? [{ label: "Car Allowance", amount: ctc.car }] : []),
        ...(ctc.lta > 0 ? [{ label: "LTA", amount: ctc.lta }] : []),
        ...dynamicByCategory("REIMBURSEMENT"),
      ],
    },
    {
      title: "Retiral benefits (employer cost)",
      rows: [
        { label: "Employer PF", amount: ctc.employerPf },
        { label: "Gratuity", amount: ctc.gratuity },
        ...(ctc.employerNps > 0 ? [{ label: "Employer NPS", amount: ctc.employerNps }] : []),
        ...dynamicByCategory("RETIRAL"),
      ],
    },
    {
      title: "Other employer cost",
      rows: dynamicByCategory("OTHER"),
    },
  ];
}

export function CtcBifurcationTable({
  sections,
  total,
  totalLabel = "Total Annual CTC",
  format,
}: {
  sections: BifurcationSection[];
  total: number;
  totalLabel?: string;
  format: (n: number) => string;
}) {
  const visibleSections = sections.filter((s) => s.rows.length > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-brand-brown-dark/10">
      <table className="w-full border-collapse text-xs">
        <tbody>
          {visibleSections.map((section) => {
            const subtotal = section.rows.reduce((sum, r) => sum + r.amount, 0);
            return (
              <Fragment key={section.title}>
                <tr className="bg-brand-blue/5">
                  <td colSpan={2} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-blue-deep">
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.label} className="border-t border-brand-brown-dark/5">
                    <td className="px-3 py-1 text-brand-brown-dark/80">{row.label}</td>
                    <td className="px-3 py-1 text-right tabular-nums text-brand-brown-dark">{format(row.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t border-brand-brown-dark/10">
                  <td className="px-3 py-1 text-right text-[11px] font-semibold text-brand-brown-dark/55">Subtotal</td>
                  <td className="px-3 py-1 text-right text-[11px] font-semibold tabular-nums text-brand-brown-dark/80">{format(subtotal)}</td>
                </tr>
              </Fragment>
            );
          })}
          <tr className="border-t-2 border-brand-brown-dark/20 bg-brand-brown-dark/5">
            <td className="px-3 py-2 text-sm font-bold text-brand-brown-dark">{totalLabel}</td>
            <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-brand-brown-dark">{format(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

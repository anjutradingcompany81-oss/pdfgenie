"use client";

import type { AgeCategory, EmployerCategory } from "@/lib/tax/rules";
import { METRO_CITIES } from "@/lib/tax/rules";
import type { EmployeeProfile } from "@/lib/tax/engine";
import { NumberField, SectionCard, SelectField, CheckboxRow } from "./shared";

const AGE_OPTIONS: { value: AgeCategory; label: string }[] = [
  { value: "BELOW_60", label: "Below 60" },
  { value: "SENIOR_60_80", label: "Senior citizen (60–80)" },
  { value: "SUPER_SENIOR_80_PLUS", label: "Super senior citizen (80+)" },
];

const EMPLOYER_OPTIONS: { value: EmployerCategory; label: string }[] = [
  { value: "PRIVATE", label: "Private sector" },
  { value: "GOVERNMENT", label: "Government" },
];

export function ProfileStep({ profile, onChange }: { profile: EmployeeProfile; onChange: (profile: EmployeeProfile) => void }) {
  const isKnownMetro = (METRO_CITIES as readonly string[]).includes(profile.city);

  return (
    <div className="space-y-5">
      <SectionCard title="Your tax profile" description="This decides which slabs, exemptions, and limits apply — assessment year 2026-27.">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Age category" value={profile.ageCategory} onChange={(v) => onChange({ ...profile, ageCategory: v })} options={AGE_OPTIONS} />
          <SelectField
            label="Employer type"
            value={profile.employerCategory}
            onChange={(v) => onChange({ ...profile, employerCategory: v })}
            options={EMPLOYER_OPTIONS}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">Work city</span>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => onChange({ ...profile, city: e.target.value })}
              placeholder="e.g. Bengaluru"
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
            />
          </label>
          <NumberField
            label="Payroll grade"
            value={profile.grade}
            onChange={(v) => onChange({ ...profile, grade: v })}
            hint="Used only for the car-reimbursement eligibility band."
          />
        </div>

        <div className="mt-4">
          {isKnownMetro ? (
            <p className="text-xs text-brand-brown-dark/55">
              {profile.city} is treated as a metro city for HRA exemption (50% of salary), matching Delhi, Mumbai, Kolkata, and Chennai.
            </p>
          ) : (
            <CheckboxRow
              label="Treat as a metro city for HRA exemption (50% of salary instead of 40%)"
              checked={profile.isMetro}
              onChange={(checked) => onChange({ ...profile, isMetro: checked })}
            />
          )}
        </div>

        <div className="mt-4">
          <NumberField
            label="Payroll months this financial year"
            value={profile.payrollMonths}
            onChange={(v) => onChange({ ...profile, payrollMonths: Math.min(12, Math.max(1, v)) })}
            min={1}
            max={12}
            hint="12 for a full year; fewer if you joined partway through FY 2025-26."
          />
        </div>
      </SectionCard>
    </div>
  );
}

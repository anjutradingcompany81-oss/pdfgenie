"use client";

import type { OldRegimeDeclarationInput, OtherIncomeInput, Section80CInput } from "@/lib/tax/engine";
import { formatINR } from "@/lib/tax/format";
import { NumberField, SectionCard, CheckboxRow } from "./shared";

const SECTION_80C_FIELDS: { key: keyof Section80CInput; label: string }[] = [
  { key: "voluntaryPf", label: "Voluntary PF" },
  { key: "ppf", label: "Public Provident Fund" },
  { key: "lifeInsurance", label: "Life insurance premium" },
  { key: "elss", label: "ELSS mutual funds" },
  { key: "tuitionFees", label: "Children's tuition fees" },
  { key: "nsc", label: "National Savings Certificate" },
  { key: "taxSaverFd", label: "5-year tax-saver FD" },
  { key: "sukanyaSamriddhi", label: "Sukanya Samriddhi Yojana" },
  { key: "housingLoanPrincipal", label: "Housing loan principal" },
  { key: "stampDutyRegistration", label: "Stamp duty & registration" },
  { key: "seniorCitizenSavingsScheme", label: "Senior Citizen Savings Scheme" },
  { key: "other", label: "Other eligible 80C investment" },
];

export function DeclarationsStep({
  declarations,
  onChangeDeclarations,
  otherIncome,
  onChangeOtherIncome,
  tdsAlreadyDeducted,
  onChangeTds,
  employeePf,
  hraExemptAmount,
  ltaReceived,
}: {
  declarations: OldRegimeDeclarationInput;
  onChangeDeclarations: (d: OldRegimeDeclarationInput) => void;
  otherIncome: OtherIncomeInput;
  onChangeOtherIncome: (o: OtherIncomeInput) => void;
  tdsAlreadyDeducted: number;
  onChangeTds: (v: number) => void;
  employeePf: number;
  hraExemptAmount: number;
  ltaReceived: number;
}) {
  const section80CTotal = employeePf + Object.values(declarations.section80C).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-5">
      <SectionCard
        title="Old-regime declarations"
        description="These only affect the old-regime column of the comparison — the new regime doesn't allow most of them."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Monthly rent paid" value={declarations.monthlyRent} onChange={(v) => onChangeDeclarations({ ...declarations, monthlyRent: v })} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">Rent city</span>
            <input
              type="text"
              value={declarations.rentCity}
              onChange={(e) => onChangeDeclarations({ ...declarations, rentCity: e.target.value })}
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-4">
          <CheckboxRow
            label="I'm declaring HRA exemption for this rent"
            checked={declarations.hasHraDeclaration}
            onChange={(checked) => onChangeDeclarations({ ...declarations, hasHraDeclaration: checked })}
          />
        </div>
        {declarations.hasHraDeclaration && (
          <p className="mt-3 text-xs font-semibold text-emerald-700">HRA exemption (old regime): {formatINR(hraExemptAmount)}</p>
        )}
      </SectionCard>

      <SectionCard
        title="LTA exemption"
        description={`You received ${formatINR(ltaReceived)} in LTA. Declare only what you can substantiate with actual eligible travel expenditure — the rest stays taxable.`}
      >
        <NumberField
          label="Eligible LTA exemption claimed"
          value={declarations.ltaExemptAmount}
          onChange={(v) => onChangeDeclarations({ ...declarations, ltaExemptAmount: v })}
          max={ltaReceived}
          hint={`Capped at LTA received (${formatINR(ltaReceived)})`}
        />
      </SectionCard>

      <SectionCard title="Section 80C" description={`Combined limit ₹1,50,000. Includes your ${formatINR(employeePf)} employee PF automatically.`}>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTION_80C_FIELDS.map((f) => (
            <NumberField
              key={f.key}
              label={f.label}
              value={declarations.section80C[f.key]}
              onChange={(v) => onChangeDeclarations({ ...declarations, section80C: { ...declarations.section80C, [f.key]: v } })}
            />
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-brand-brown-dark/70">
          Declared total (incl. employee PF): {formatINR(section80CTotal)} — capped at ₹1,50,000
        </p>
      </SectionCard>

      <SectionCard title="Other deductions">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Additional NPS — Section 80CCD(1B)"
            value={declarations.employeeNpsAdditional}
            onChange={(v) => onChangeDeclarations({ ...declarations, employeeNpsAdditional: v })}
            hint="Up to ₹50,000, on top of 80C"
          />
          <NumberField
            label="Health insurance — self & family"
            value={declarations.section80DSelfPremium}
            onChange={(v) => onChangeDeclarations({ ...declarations, section80DSelfPremium: v })}
          />
          <NumberField
            label="Health insurance — parents"
            value={declarations.section80DParentsPremium}
            onChange={(v) => onChangeDeclarations({ ...declarations, section80DParentsPremium: v })}
          />
          <NumberField
            label="Preventive health check-up"
            value={declarations.section80DPreventiveCheckup}
            onChange={(v) => onChangeDeclarations({ ...declarations, section80DPreventiveCheckup: v })}
          />
          <div className="flex flex-col justify-center gap-2">
            <CheckboxRow label="I am a senior citizen" checked={declarations.isSelfSenior} onChange={(v) => onChangeDeclarations({ ...declarations, isSelfSenior: v })} />
            <CheckboxRow
              label="My parents are senior citizens"
              checked={declarations.areParentsSenior}
              onChange={(v) => onChangeDeclarations({ ...declarations, areParentsSenior: v })}
            />
          </div>
          <NumberField label="Education loan interest — 80E" value={declarations.section80E} onChange={(v) => onChangeDeclarations({ ...declarations, section80E: v })} />
          <NumberField
            label="Home loan interest — self-occupied, Sec 24(b)"
            value={declarations.section24bHomeLoanInterest}
            onChange={(v) => onChangeDeclarations({ ...declarations, section24bHomeLoanInterest: v })}
            hint="Capped at ₹2,00,000"
          />
          <NumberField label="Donations — 80G" value={declarations.section80G} onChange={(v) => onChangeDeclarations({ ...declarations, section80G: v })} />
          <NumberField
            label="Rent paid, no HRA — 80GG"
            value={declarations.section80GG}
            onChange={(v) => onChangeDeclarations({ ...declarations, section80GG: v })}
            hint={declarations.hasHraDeclaration ? "Disabled — HRA already claimed" : "Capped at ₹60,000"}
          />
          <NumberField label="Dependent disability — 80DD" value={declarations.section80DD} onChange={(v) => onChangeDeclarations({ ...declarations, section80DD: v })} />
          <NumberField label="Medical treatment — 80DDB" value={declarations.section80DDB} onChange={(v) => onChangeDeclarations({ ...declarations, section80DDB: v })} />
          <NumberField label="Self disability — 80U" value={declarations.section80U} onChange={(v) => onChangeDeclarations({ ...declarations, section80U: v })} />
          <NumberField
            label="Professional tax paid (annual)"
            value={declarations.professionalTaxAnnual}
            onChange={(v) => onChangeDeclarations({ ...declarations, professionalTaxAnnual: v })}
          />
        </div>
      </SectionCard>

      <SectionCard title="Other income" description="Interest, dividends, and rent are taxed at slab rates. Capital gains and similar special-rate income are kept separate.">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Interest income (savings + FD)" value={otherIncome.interestIncome} onChange={(v) => onChangeOtherIncome({ ...otherIncome, interestIncome: v })} />
          <NumberField label="Dividend income" value={otherIncome.dividendIncome} onChange={(v) => onChangeOtherIncome({ ...otherIncome, dividendIncome: v })} />
          <NumberField label="Rental income (net)" value={otherIncome.rentalIncomeNet} onChange={(v) => onChangeOtherIncome({ ...otherIncome, rentalIncomeNet: v })} />
          <NumberField label="Family pension" value={otherIncome.familyPension} onChange={(v) => onChangeOtherIncome({ ...otherIncome, familyPension: v })} />
          <NumberField
            label="Previous employer — taxable salary"
            value={otherIncome.previousEmployerTaxableSalary}
            onChange={(v) => onChangeOtherIncome({ ...otherIncome, previousEmployerTaxableSalary: v })}
          />
          <NumberField
            label="Previous employer — TDS deducted"
            value={otherIncome.previousEmployerTds}
            onChange={(v) => onChangeOtherIncome({ ...otherIncome, previousEmployerTds: v })}
          />
          <NumberField
            label="Other income (freelance, business, etc.)"
            value={otherIncome.otherSlabTaxedIncome}
            onChange={(v) => onChangeOtherIncome({ ...otherIncome, otherSlabTaxedIncome: v })}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-brand-brown-dark/10 p-4">
          <p className="mb-3 text-sm font-semibold text-brand-brown-dark">Income taxed at a special rate</p>
          <p className="mb-3 text-xs text-brand-brown-dark/55">
            Capital gains, lottery winnings, virtual digital assets, and similar income — taxed at its own flat rate,
            never blended into slab-rate income.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Amount" value={otherIncome.specialRateIncome} onChange={(v) => onChangeOtherIncome({ ...otherIncome, specialRateIncome: v })} />
            <NumberField
              label="Applicable rate"
              value={Math.round(otherIncome.specialRateIncomeTaxRate * 100)}
              onChange={(v) => onChangeOtherIncome({ ...otherIncome, specialRateIncomeTaxRate: v / 100 })}
              suffix="%"
              max={100}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="TDS already deducted this year">
        <NumberField label="TDS already deducted by current employer" value={tdsAlreadyDeducted} onChange={onChangeTds} />
      </SectionCard>
    </div>
  );
}

/**
 * Tax rules for AY 2026-27 (FY 2025-26), per Finance Act 2025.
 * Kept as a single versioned config object (not hard-coded into calculation
 * logic) so a future assessment year can be added by adding a new entry to
 * TAX_RULE_VERSIONS without touching lib/tax/engine.ts.
 */

export type AgeCategory = "BELOW_60" | "SENIOR_60_80" | "SUPER_SENIOR_80_PLUS";
export type TaxRegime = "OLD" | "NEW";
export type EmployerCategory = "PRIVATE" | "GOVERNMENT";

export type SlabRule = { upto: number | null; rate: number };

export type SurchargeSlab = { above: number; rate: number };

export type Tax80DLimits = { selfAndFamily: number; parents: number; preventiveCheckup: number };

export const METRO_CITIES = ["Delhi", "Mumbai", "Kolkata", "Chennai"] as const;

export type TaxRuleVersion = {
  financialYear: string;
  assessmentYear: string;
  status: "draft" | "reviewed" | "approved" | "archived";
  sourceReference: string;

  newRegimeSlabs: SlabRule[];
  oldRegimeSlabs: Record<AgeCategory, SlabRule[]>;

  standardDeduction: Record<TaxRegime, number>;

  rebate: Record<
    TaxRegime,
    { maxTaxableIncome: number; maxRebateAmount: number; marginalRelief: boolean }
  >;

  surcharge: Record<TaxRegime, SurchargeSlab[]>;
  cessRate: number;

  section80CLimit: number;
  section80CCD1BLimit: number;
  section80D: { nonSenior: Tax80DLimits; senior: Tax80DLimits };
  section80TTA: number;
  section80TTB: number;
  section24bSelfOccupiedLimit: number;
  section80GGLimit: number;
  section80EEALimit: number;

  hra: { metroPercentOfSalary: number; nonMetroPercentOfSalary: number; rentThresholdPercentOfSalary: number };

  employerNpsDeductionLimit: Record<TaxRegime, Record<EmployerCategory, number>>;
  employerRetiralTaxableExcessThreshold: number;

  payroll: {
    employerPfPercentOfBasic: number;
    employeePfPercentOfBasic: number;
    pfWageCeilingMonthly: number;
    gratuityPercentOfBasic: number;
    ltaPercentOfBasic: number;
  };

  carReimbursementGradeBands: { minGrade: number; maxGrade: number | null; annualAmount: number }[];
};

export const AY_2026_27: TaxRuleVersion = {
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  status: "approved",
  sourceReference: "Finance Act 2025 (Budget 2025-26)",

  newRegimeSlabs: [
    { upto: 400000, rate: 0 },
    { upto: 800000, rate: 0.05 },
    { upto: 1200000, rate: 0.1 },
    { upto: 1600000, rate: 0.15 },
    { upto: 2000000, rate: 0.2 },
    { upto: 2400000, rate: 0.25 },
    { upto: null, rate: 0.3 },
  ],

  oldRegimeSlabs: {
    BELOW_60: [
      { upto: 250000, rate: 0 },
      { upto: 500000, rate: 0.05 },
      { upto: 1000000, rate: 0.2 },
      { upto: null, rate: 0.3 },
    ],
    SENIOR_60_80: [
      { upto: 300000, rate: 0 },
      { upto: 500000, rate: 0.05 },
      { upto: 1000000, rate: 0.2 },
      { upto: null, rate: 0.3 },
    ],
    SUPER_SENIOR_80_PLUS: [
      { upto: 500000, rate: 0 },
      { upto: 1000000, rate: 0.2 },
      { upto: null, rate: 0.3 },
    ],
  },

  standardDeduction: { OLD: 50000, NEW: 75000 },

  rebate: {
    OLD: { maxTaxableIncome: 500000, maxRebateAmount: 12500, marginalRelief: false },
    NEW: { maxTaxableIncome: 1200000, maxRebateAmount: 60000, marginalRelief: true },
  },

  surcharge: {
    OLD: [
      { above: 5000000, rate: 0.1 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 },
      { above: 50000000, rate: 0.37 },
    ],
    NEW: [
      { above: 5000000, rate: 0.1 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 },
    ],
  },
  cessRate: 0.04,

  section80CLimit: 150000,
  section80CCD1BLimit: 50000,
  section80D: {
    nonSenior: { selfAndFamily: 25000, parents: 25000, preventiveCheckup: 5000 },
    senior: { selfAndFamily: 50000, parents: 50000, preventiveCheckup: 5000 },
  },
  section80TTA: 10000,
  section80TTB: 50000,
  section24bSelfOccupiedLimit: 200000,
  section80GGLimit: 60000,
  section80EEALimit: 150000,

  hra: { metroPercentOfSalary: 0.5, nonMetroPercentOfSalary: 0.4, rentThresholdPercentOfSalary: 0.1 },

  employerNpsDeductionLimit: {
    OLD: { PRIVATE: 0.1, GOVERNMENT: 0.14 },
    NEW: { PRIVATE: 0.14, GOVERNMENT: 0.14 },
  },
  employerRetiralTaxableExcessThreshold: 750000,

  payroll: {
    employerPfPercentOfBasic: 0.12,
    employeePfPercentOfBasic: 0.12,
    pfWageCeilingMonthly: 15000,
    gratuityPercentOfBasic: 0.0481,
    ltaPercentOfBasic: 0.0833,
  },

  carReimbursementGradeBands: [
    { minGrade: 1, maxGrade: 9, annualAmount: 50000 },
    { minGrade: 10, maxGrade: 14, annualAmount: 150000 },
    { minGrade: 15, maxGrade: null, annualAmount: 250000 },
  ],
};

export const TAX_RULE_VERSIONS: Record<string, TaxRuleVersion> = {
  "2026-27": AY_2026_27,
};

export const DEFAULT_ASSESSMENT_YEAR = "2026-27";

export function getTaxRules(assessmentYear: string): TaxRuleVersion {
  return TAX_RULE_VERSIONS[assessmentYear] ?? AY_2026_27;
}

export function isMetroCity(city: string): boolean {
  return (METRO_CITIES as readonly string[]).includes(city);
}

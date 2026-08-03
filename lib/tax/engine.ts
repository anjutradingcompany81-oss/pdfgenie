/**
 * Deterministic CTC + income-tax calculation engine for India (AY 2026-27).
 *
 * All amounts are annual rupees, rounded to the nearest rupee after every
 * step to avoid floating-point drift compounding across a long formula
 * chain. This is the single engine used by the wizard preview and the
 * PDF/Excel report generators, so all three always agree.
 *
 * CTC structure: Basic, HRA, Employer PF, Gratuity, Employer NPS, Car
 * Allowance, and LTA are always-present, individually %-editable fields.
 * Everything else (Variable Pay, Bonus, DA, other reimbursements,
 * Superannuation, other employer cost, or any custom line) lives in
 * dynamicComponents — a user-managed list that starts empty and can be
 * added to or removed from freely. Special Allowance is never directly
 * editable; it always absorbs whatever's left of Total CTC.
 *
 * Simplifications (documented, not silently assumed):
 * - Employer PF/gratuity/NPS/superannuation are modelled as employer cost,
 *   not cash paid to the employee; only the combined-excess-over-₹7.5L
 *   perquisite rule (Sec 17(2)(vii), which covers PF + NPS + superannuation
 *   but not gratuity) is applied for taxability.
 * - LTA/car/other reimbursements are NOT assumed exempt — LTA exemption is
 *   only what the user declares as eligible travel expenditure (old regime
 *   only); all other reimbursements are treated as fully taxable cash
 *   allowances unless the user marks an exempt amount.
 * - "Other income" taxable at special rates (capital gains, lottery,
 *   virtual digital assets) is kept in its own bucket and taxed at a flat,
 *   user-set rate — never blended into slab-rate income.
 * - Monthly TDS schedule assumes even distribution of the remaining
 *   payable tax across the remaining payroll months of the FY.
 */

import {
  type AgeCategory,
  type EmployerCategory,
  type SlabRule,
  type SurchargeSlab,
  type TaxRegime,
  type TaxRuleVersion,
  getTaxRules,
  isMetroCity,
} from "./rules";

export type { AgeCategory, EmployerCategory, TaxRegime } from "./rules";

function round(n: number): number {
  return Math.round(n);
}

function roundToNearestTen(n: number): number {
  return Math.round(n / 10) * 10;
}

function clampNonNegative(n: number): number {
  return Math.max(0, n);
}

let dynamicComponentIdCounter = 0;
export function createDynamicComponentId(): string {
  dynamicComponentIdCounter += 1;
  return `dyn-${Date.now()}-${dynamicComponentIdCounter}`;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type DynamicComponentCategory = "FIXED" | "REIMBURSEMENT" | "RETIRAL" | "OTHER";

export type DynamicComponent = {
  id: string;
  label: string;
  category: DynamicComponentCategory;
  percentOfCtc: number;
  amountOverride: number | null;
};

export type ResolvedDynamicComponent = DynamicComponent & { amount: number };

export const DYNAMIC_COMPONENT_PRESETS: { label: string; category: DynamicComponentCategory }[] = [
  { label: "Variable Pay", category: "FIXED" },
  { label: "Bonus", category: "FIXED" },
  { label: "Dearness Allowance", category: "FIXED" },
  { label: "Other Allowance", category: "FIXED" },
  { label: "Fuel Reimbursement", category: "REIMBURSEMENT" },
  { label: "Driver Reimbursement", category: "REIMBURSEMENT" },
  { label: "Telephone Reimbursement", category: "REIMBURSEMENT" },
  { label: "Internet Reimbursement", category: "REIMBURSEMENT" },
  { label: "Meal Reimbursement", category: "REIMBURSEMENT" },
  { label: "Books & Periodicals", category: "REIMBURSEMENT" },
  { label: "Uniform Reimbursement", category: "REIMBURSEMENT" },
  { label: "Superannuation", category: "RETIRAL" },
  { label: "Other Employer Cost", category: "OTHER" },
];

export type EmployeeProfile = {
  assessmentYear: string;
  ageCategory: AgeCategory;
  city: string;
  isMetro: boolean;
  employerCategory: EmployerCategory;
  grade: number;
  payrollMonths: number;
};

export type CtcStructureInput = {
  totalAnnualCtc: number;

  basicPercentOfCtc: number;
  basicOverride: number | null;

  hraPercentOfBasic: number;
  hraOverride: number | null;

  pfOnFullBasic: boolean;
  employerPfPercentOfBasic: number;
  employerPfOverride: number | null;

  gratuityPercentOfBasic: number;
  gratuityOverride: number | null;

  employerNpsPercentOfBasic: number;
  employerNpsOverride: number | null;

  carPercentOfCtc: number;
  carOverride: number | null;

  ltaPercentOfBasic: number;
  ltaOverride: number | null;

  dynamicComponents: DynamicComponent[];
};

export type Section80CInput = {
  voluntaryPf: number;
  ppf: number;
  lifeInsurance: number;
  elss: number;
  tuitionFees: number;
  nsc: number;
  taxSaverFd: number;
  sukanyaSamriddhi: number;
  housingLoanPrincipal: number;
  stampDutyRegistration: number;
  seniorCitizenSavingsScheme: number;
  other: number;
};

export type OldRegimeDeclarationInput = {
  monthlyRent: number;
  rentCity: string;
  hasHraDeclaration: boolean;

  ltaExemptAmount: number;

  section80C: Section80CInput;
  employeeNpsAdditional: number; // Sec 80CCD(1B)

  section80DSelfPremium: number;
  section80DParentsPremium: number;
  section80DPreventiveCheckup: number;
  isSelfSenior: boolean;
  areParentsSenior: boolean;

  section80E: number;
  section80EEA: number;
  section80G: number;
  section80GG: number;
  section80DD: number;
  section80DDB: number;
  section80U: number;
  section24bHomeLoanInterest: number;
  professionalTaxAnnual: number;
};

export type OtherIncomeInput = {
  interestIncome: number;
  dividendIncome: number;
  rentalIncomeNet: number;
  familyPension: number;
  previousEmployerTaxableSalary: number;
  previousEmployerTds: number;
  otherSlabTaxedIncome: number;
  specialRateIncome: number;
  specialRateIncomeTaxRate: number;
};

export type CalculatorInput = {
  profile: EmployeeProfile;
  ctc: CtcStructureInput;
  oldRegimeDeclarations: OldRegimeDeclarationInput;
  otherIncome: OtherIncomeInput;
  tdsAlreadyDeducted: number;
};

export function createDefaultInput(): CalculatorInput {
  return {
    profile: {
      assessmentYear: "2026-27",
      ageCategory: "BELOW_60",
      city: "Bengaluru",
      isMetro: false,
      employerCategory: "PRIVATE",
      grade: 8,
      payrollMonths: 12,
    },
    ctc: {
      totalAnnualCtc: 1200000,
      basicPercentOfCtc: 50,
      basicOverride: null,
      hraPercentOfBasic: 50,
      hraOverride: null,
      pfOnFullBasic: true,
      employerPfPercentOfBasic: 12,
      employerPfOverride: null,
      gratuityPercentOfBasic: 4.81,
      gratuityOverride: null,
      employerNpsPercentOfBasic: 0,
      employerNpsOverride: null,
      carPercentOfCtc: 0,
      carOverride: null,
      ltaPercentOfBasic: 8.33,
      ltaOverride: null,
      dynamicComponents: [],
    },
    oldRegimeDeclarations: {
      monthlyRent: 0,
      rentCity: "Bengaluru",
      hasHraDeclaration: false,
      ltaExemptAmount: 0,
      section80C: {
        voluntaryPf: 0,
        ppf: 0,
        lifeInsurance: 0,
        elss: 0,
        tuitionFees: 0,
        nsc: 0,
        taxSaverFd: 0,
        sukanyaSamriddhi: 0,
        housingLoanPrincipal: 0,
        stampDutyRegistration: 0,
        seniorCitizenSavingsScheme: 0,
        other: 0,
      },
      employeeNpsAdditional: 0,
      section80DSelfPremium: 0,
      section80DParentsPremium: 0,
      section80DPreventiveCheckup: 0,
      isSelfSenior: false,
      areParentsSenior: false,
      section80E: 0,
      section80EEA: 0,
      section80G: 0,
      section80GG: 0,
      section80DD: 0,
      section80DDB: 0,
      section80U: 0,
      section24bHomeLoanInterest: 0,
      professionalTaxAnnual: 2400,
    },
    otherIncome: {
      interestIncome: 0,
      dividendIncome: 0,
      rentalIncomeNet: 0,
      familyPension: 0,
      previousEmployerTaxableSalary: 0,
      previousEmployerTds: 0,
      otherSlabTaxedIncome: 0,
      specialRateIncome: 0,
      specialRateIncomeTaxRate: 0.2,
    },
    tdsAlreadyDeducted: 0,
  };
}

// ---------------------------------------------------------------------------
// CTC structure
// ---------------------------------------------------------------------------

export type CtcBreakdown = {
  basic: number;
  hra: number;
  specialAllowance: number;
  car: number;
  lta: number;
  dearnessAllowanceForRetirals: number;
  dynamicComponents: ResolvedDynamicComponent[];
  employeePf: number;
  employerPf: number;
  gratuity: number;
  employerNps: number;
  totalEmployerRetirals: number;
  otherEmployerCostTotal: number;
  taxableExcessRetirals: number;
  totalAnnualCtc: number;
  cashComponentsTotal: number;
  isBalanced: boolean;
  shortfallOrExcess: number;
  carGradeEligibility: number;
};

export function buildCtcStructure(
  ctc: CtcStructureInput,
  profile: EmployeeProfile,
  rules: TaxRuleVersion
): CtcBreakdown {
  const basic = round(ctc.basicOverride ?? ctc.totalAnnualCtc * (ctc.basicPercentOfCtc / 100));
  const hra = round(ctc.hraOverride ?? basic * (ctc.hraPercentOfBasic / 100));
  const car = round(ctc.carOverride ?? ctc.totalAnnualCtc * (ctc.carPercentOfCtc / 100));
  const lta = round(ctc.ltaOverride ?? basic * (ctc.ltaPercentOfBasic / 100));

  const pfWageBase = ctc.pfOnFullBasic ? basic : Math.min(basic, rules.payroll.pfWageCeilingMonthly * 12);
  const employeePf = round(pfWageBase * rules.payroll.employeePfPercentOfBasic);
  const employerPf = round(ctc.employerPfOverride ?? pfWageBase * (ctc.employerPfPercentOfBasic / 100));
  const gratuity = round(ctc.gratuityOverride ?? basic * (ctc.gratuityPercentOfBasic / 100));
  const employerNps = round(ctc.employerNpsOverride ?? basic * (ctc.employerNpsPercentOfBasic / 100));

  const dynamicComponents: ResolvedDynamicComponent[] = ctc.dynamicComponents.map((c) => ({
    ...c,
    amount: round(c.amountOverride ?? ctc.totalAnnualCtc * (c.percentOfCtc / 100)),
  }));
  const dynamicRetiralTotal = dynamicComponents.filter((c) => c.category === "RETIRAL").reduce((sum, c) => sum + c.amount, 0);
  const otherEmployerCostTotal = dynamicComponents.filter((c) => c.category === "OTHER").reduce((sum, c) => sum + c.amount, 0);
  const dynamicCashTotal = dynamicComponents
    .filter((c) => c.category === "FIXED" || c.category === "REIMBURSEMENT")
    .reduce((sum, c) => sum + c.amount, 0);

  const dearnessAllowanceForRetirals = dynamicComponents.find((c) => c.label === "Dearness Allowance")?.amount ?? 0;

  const totalEmployerRetirals = employerPf + gratuity + employerNps + dynamicRetiralTotal;
  const retiralExcessBase = employerPf + employerNps + dynamicRetiralTotal; // Sec 17(2)(vii) excludes gratuity
  const taxableExcessRetirals = clampNonNegative(retiralExcessBase - rules.employerRetiralTaxableExcessThreshold);

  const nonCashEmployerCost = totalEmployerRetirals + otherEmployerCostTotal;
  const everythingExceptSpecial = basic + hra + car + lta + dynamicCashTotal + nonCashEmployerCost;

  const specialAllowance = round(ctc.totalAnnualCtc - everythingExceptSpecial);
  const isBalanced = specialAllowance >= 0;

  const cashComponentsTotal = basic + hra + Math.max(0, specialAllowance) + car + lta + dynamicCashTotal;

  const carBand = rules.carReimbursementGradeBands.find(
    (b) => profile.grade >= b.minGrade && (b.maxGrade === null || profile.grade <= b.maxGrade)
  );

  return {
    basic,
    hra,
    specialAllowance,
    car,
    lta,
    dearnessAllowanceForRetirals,
    dynamicComponents,
    employeePf,
    employerPf,
    gratuity,
    employerNps,
    totalEmployerRetirals,
    otherEmployerCostTotal,
    taxableExcessRetirals,
    totalAnnualCtc: round(ctc.totalAnnualCtc),
    cashComponentsTotal,
    isBalanced,
    shortfallOrExcess: isBalanced ? 0 : specialAllowance,
    carGradeEligibility: carBand?.annualAmount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// HRA exemption (old regime only)
// ---------------------------------------------------------------------------

export type HraExemptionResult = {
  hraReceived: number;
  rentPaid: number;
  salaryForHra: number;
  rentThreshold: number;
  excessRentOverThreshold: number;
  percentOfSalaryLimit: number;
  exemptAmount: number;
  taxableAmount: number;
};

export function calculateHraExemption(
  ctc: CtcBreakdown,
  declarations: OldRegimeDeclarationInput,
  isMetro: boolean,
  rules: TaxRuleVersion
): HraExemptionResult {
  const hraReceived = ctc.hra;
  const rentPaid = round(declarations.monthlyRent * 12);
  const salaryForHra = ctc.basic + ctc.dearnessAllowanceForRetirals;
  const rentThreshold = round(salaryForHra * rules.hra.rentThresholdPercentOfSalary);
  const excessRentOverThreshold = clampNonNegative(rentPaid - rentThreshold);
  const percentOfSalaryLimit = round(
    salaryForHra * (isMetro ? rules.hra.metroPercentOfSalary : rules.hra.nonMetroPercentOfSalary)
  );

  const exemptAmount = declarations.hasHraDeclaration
    ? Math.min(hraReceived, excessRentOverThreshold, percentOfSalaryLimit)
    : 0;

  return {
    hraReceived,
    rentPaid,
    salaryForHra,
    rentThreshold,
    excessRentOverThreshold,
    percentOfSalaryLimit,
    exemptAmount,
    taxableAmount: hraReceived - exemptAmount,
  };
}

// ---------------------------------------------------------------------------
// Chapter VI-A + exemptions per regime
// ---------------------------------------------------------------------------

export type DeductionLine = { label: string; claimed: number; allowed: number; note?: string };

export type RegimeIncomeBuild = {
  regime: TaxRegime;
  grossSalary: number;
  exemptAllowances: number;
  standardDeduction: number;
  professionalTaxDeduction: number;
  taxableSalary: number;
  familyPensionDeduction: number;
  otherIncomeForSlab: number;
  chapterVIADeductions: number;
  chapterVIABreakdown: DeductionLine[];
  totalTaxableIncomeBeforeSpecialRate: number;
};

function build80C(declarations: OldRegimeDeclarationInput, employeePf: number, rules: TaxRuleVersion): DeductionLine {
  const c = declarations.section80C;
  const claimed =
    employeePf +
    c.voluntaryPf +
    c.ppf +
    c.lifeInsurance +
    c.elss +
    c.tuitionFees +
    c.nsc +
    c.taxSaverFd +
    c.sukanyaSamriddhi +
    c.housingLoanPrincipal +
    c.stampDutyRegistration +
    c.seniorCitizenSavingsScheme +
    c.other;
  return { label: "Section 80C", claimed, allowed: Math.min(claimed, rules.section80CLimit) };
}

function build80D(declarations: OldRegimeDeclarationInput, rules: TaxRuleVersion): DeductionLine {
  const limits = declarations.isSelfSenior ? rules.section80D.senior : rules.section80D.nonSenior;
  const parentLimits = declarations.areParentsSenior ? rules.section80D.senior : rules.section80D.nonSenior;
  const selfClaimed = declarations.section80DSelfPremium + declarations.section80DPreventiveCheckup;
  const selfAllowed = Math.min(selfClaimed, limits.selfAndFamily);
  const parentsAllowed = Math.min(declarations.section80DParentsPremium, parentLimits.parents);
  return {
    label: "Section 80D (medical insurance)",
    claimed: selfClaimed + declarations.section80DParentsPremium,
    allowed: selfAllowed + parentsAllowed,
  };
}

function buildOldRegimeIncome(
  ctc: CtcBreakdown,
  hra: HraExemptionResult,
  declarations: OldRegimeDeclarationInput,
  otherIncome: OtherIncomeInput,
  ageCategory: AgeCategory,
  rules: TaxRuleVersion
): RegimeIncomeBuild {
  const ltaExempt = Math.min(declarations.ltaExemptAmount, ctc.lta);

  const exemptAllowances = hra.exemptAmount + ltaExempt;
  const grossSalary = ctc.cashComponentsTotal + ctc.taxableExcessRetirals + otherIncome.previousEmployerTaxableSalary;
  const standardDeduction = rules.standardDeduction.OLD;
  const professionalTaxDeduction = declarations.professionalTaxAnnual;
  const taxableSalary = clampNonNegative(grossSalary - exemptAllowances - standardDeduction - professionalTaxDeduction);

  const familyPensionDeduction = Math.min(15000, round(otherIncome.familyPension / 3));
  const otherIncomeForSlab =
    otherIncome.interestIncome +
    otherIncome.dividendIncome +
    otherIncome.rentalIncomeNet +
    otherIncome.otherSlabTaxedIncome +
    clampNonNegative(otherIncome.familyPension - familyPensionDeduction);

  const breakdown: DeductionLine[] = [];
  breakdown.push(build80C(declarations, ctc.employeePf, rules));

  const npsSalaryBase = ctc.basic + ctc.dearnessAllowanceForRetirals;
  const employerNpsLimit = round(npsSalaryBase * rules.employerNpsDeductionLimit.OLD.PRIVATE);
  breakdown.push({
    label: "Section 80CCD(2) — employer NPS",
    claimed: ctc.employerNps,
    allowed: Math.min(ctc.employerNps, employerNpsLimit),
  });
  breakdown.push({
    label: "Section 80CCD(1B) — additional NPS",
    claimed: declarations.employeeNpsAdditional,
    allowed: Math.min(declarations.employeeNpsAdditional, rules.section80CCD1BLimit),
  });
  breakdown.push(build80D(declarations, rules));
  breakdown.push({ label: "Section 80E — education loan interest", claimed: declarations.section80E, allowed: declarations.section80E });
  breakdown.push({
    label: "Section 80EEA — affordable housing loan interest",
    claimed: declarations.section80EEA,
    allowed: Math.min(declarations.section80EEA, rules.section80EEALimit),
  });
  breakdown.push({ label: "Section 80G — donations", claimed: declarations.section80G, allowed: declarations.section80G });

  const gg = declarations.hasHraDeclaration ? 0 : declarations.section80GG;
  breakdown.push({
    label: "Section 80GG — rent (no HRA)",
    claimed: declarations.section80GG,
    allowed: Math.min(gg, rules.section80GGLimit),
    note: declarations.hasHraDeclaration ? "Not allowed — HRA already claimed for the same period." : undefined,
  });

  const ttaLimit = ageCategory === "BELOW_60" ? rules.section80TTA : rules.section80TTB;
  breakdown.push({
    label: ageCategory === "BELOW_60" ? "Section 80TTA — savings interest" : "Section 80TTB — interest income",
    claimed: otherIncome.interestIncome,
    allowed: Math.min(otherIncome.interestIncome, ttaLimit),
  });

  breakdown.push({ label: "Section 80DD — dependent with disability", claimed: declarations.section80DD, allowed: declarations.section80DD });
  breakdown.push({ label: "Section 80DDB — medical treatment", claimed: declarations.section80DDB, allowed: declarations.section80DDB });
  breakdown.push({ label: "Section 80U — self disability", claimed: declarations.section80U, allowed: declarations.section80U });
  breakdown.push({
    label: "Section 24(b) — home loan interest (self-occupied)",
    claimed: declarations.section24bHomeLoanInterest,
    allowed: Math.min(declarations.section24bHomeLoanInterest, rules.section24bSelfOccupiedLimit),
  });

  const chapterVIADeductions = breakdown.reduce((sum, d) => sum + d.allowed, 0);
  const totalTaxableIncomeBeforeSpecialRate = clampNonNegative(taxableSalary + otherIncomeForSlab - chapterVIADeductions);

  return {
    regime: "OLD",
    grossSalary,
    exemptAllowances,
    standardDeduction,
    professionalTaxDeduction,
    taxableSalary,
    familyPensionDeduction,
    otherIncomeForSlab,
    chapterVIADeductions,
    chapterVIABreakdown: breakdown,
    totalTaxableIncomeBeforeSpecialRate,
  };
}

function buildNewRegimeIncome(
  ctc: CtcBreakdown,
  otherIncome: OtherIncomeInput,
  rules: TaxRuleVersion
): RegimeIncomeBuild {
  const grossSalary = ctc.cashComponentsTotal + ctc.taxableExcessRetirals + otherIncome.previousEmployerTaxableSalary;
  const standardDeduction = rules.standardDeduction.NEW;
  const taxableSalary = clampNonNegative(grossSalary - standardDeduction);

  const familyPensionDeduction = Math.min(15000, round(otherIncome.familyPension / 3));
  const otherIncomeForSlab =
    otherIncome.interestIncome +
    otherIncome.dividendIncome +
    otherIncome.rentalIncomeNet +
    otherIncome.otherSlabTaxedIncome +
    clampNonNegative(otherIncome.familyPension - familyPensionDeduction);

  const npsSalaryBase = ctc.basic + ctc.dearnessAllowanceForRetirals;
  const employerNpsLimit = round(npsSalaryBase * rules.employerNpsDeductionLimit.NEW.PRIVATE);
  const breakdown: DeductionLine[] = [
    {
      label: "Section 80CCD(2) — employer NPS",
      claimed: ctc.employerNps,
      allowed: Math.min(ctc.employerNps, employerNpsLimit),
    },
  ];

  const chapterVIADeductions = breakdown.reduce((sum, d) => sum + d.allowed, 0);
  const totalTaxableIncomeBeforeSpecialRate = clampNonNegative(taxableSalary + otherIncomeForSlab - chapterVIADeductions);

  return {
    regime: "NEW",
    grossSalary,
    exemptAllowances: 0,
    standardDeduction,
    professionalTaxDeduction: 0,
    taxableSalary,
    familyPensionDeduction,
    otherIncomeForSlab,
    chapterVIADeductions,
    chapterVIABreakdown: breakdown,
    totalTaxableIncomeBeforeSpecialRate,
  };
}

// ---------------------------------------------------------------------------
// Slab tax + rebate + surcharge (with marginal relief) + cess
// ---------------------------------------------------------------------------

function computeSlabTax(taxableIncome: number, slabs: SlabRule[]): number {
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    const upper = slab.upto ?? Infinity;
    if (taxableIncome > lower) {
      tax += (Math.min(taxableIncome, upper) - lower) * slab.rate;
    }
    lower = upper;
    if (taxableIncome <= upper) break;
  }
  return round(tax);
}

function computeRebate(taxBeforeRebate: number, taxableIncome: number, regime: TaxRegime, rules: TaxRuleVersion): number {
  const r = rules.rebate[regime];
  if (taxableIncome <= r.maxTaxableIncome) {
    return round(Math.min(taxBeforeRebate, r.maxRebateAmount));
  }
  if (!r.marginalRelief) return 0;
  const relief = taxBeforeRebate - (taxableIncome - r.maxTaxableIncome);
  return round(Math.max(0, Math.min(relief, r.maxRebateAmount)));
}

function findSurchargeSlabIndex(taxableIncome: number, slabs: SurchargeSlab[]): number {
  let index = -1;
  slabs.forEach((s, i) => {
    if (taxableIncome > s.above) index = i;
  });
  return index;
}

function computeSurcharge(
  taxAfterRebate: number,
  taxableIncome: number,
  slabs: SurchargeSlab[],
  slabRates: SlabRule[]
): { surcharge: number; marginalRelief: number } {
  const index = findSurchargeSlabIndex(taxableIncome, slabs);
  if (index === -1) return { surcharge: 0, marginalRelief: 0 };

  const { above: threshold, rate } = slabs[index];
  const rawSurcharge = round(taxAfterRebate * rate);
  const totalNow = taxAfterRebate + rawSurcharge;

  const prevRate = index > 0 ? slabs[index - 1].rate : 0;
  const taxAtThreshold = computeSlabTax(threshold, slabRates);
  const surchargeAtThreshold = round(taxAtThreshold * prevRate);
  const totalAtThreshold = taxAtThreshold + surchargeAtThreshold;
  const maxAllowedTotal = totalAtThreshold + (taxableIncome - threshold);

  if (totalNow > maxAllowedTotal) {
    const marginalRelief = round(totalNow - maxAllowedTotal);
    return { surcharge: rawSurcharge - marginalRelief, marginalRelief };
  }
  return { surcharge: rawSurcharge, marginalRelief: 0 };
}

export type TaxOnIncomeResult = {
  taxBeforeRebate: number;
  rebate: number;
  taxAfterRebate: number;
  surcharge: number;
  marginalReliefSurcharge: number;
  cess: number;
  taxOnSpecialRateIncome: number;
  finalAnnualTax: number;
};

export function computeTaxOnIncome(
  taxableIncome: number,
  specialRateIncome: number,
  specialRateTaxRate: number,
  regime: TaxRegime,
  ageCategory: AgeCategory,
  rules: TaxRuleVersion
): TaxOnIncomeResult {
  const slabs = regime === "NEW" ? rules.newRegimeSlabs : rules.oldRegimeSlabs[ageCategory];
  const taxableIncomeRounded = roundToNearestTen(taxableIncome);

  const taxBeforeRebate = computeSlabTax(taxableIncomeRounded, slabs);
  const rebate = computeRebate(taxBeforeRebate, taxableIncomeRounded, regime, rules);
  const taxAfterRebate = taxBeforeRebate - rebate;

  const { surcharge, marginalRelief } = computeSurcharge(taxAfterRebate, taxableIncomeRounded, rules.surcharge[regime], slabs);
  const taxOnSpecialRateIncome = round(specialRateIncome * specialRateTaxRate);
  const cess = round((taxAfterRebate + surcharge + taxOnSpecialRateIncome) * rules.cessRate);
  const finalAnnualTax = roundToNearestTen(taxAfterRebate + surcharge + cess + taxOnSpecialRateIncome);

  return {
    taxBeforeRebate,
    rebate,
    taxAfterRebate,
    surcharge,
    marginalReliefSurcharge: marginalRelief,
    cess,
    taxOnSpecialRateIncome,
    finalAnnualTax,
  };
}

function findBreakEvenAdditionalDeduction(
  oldTaxableIncome: number,
  specialRateIncome: number,
  specialRateTaxRate: number,
  newFinalTax: number,
  ageCategory: AgeCategory,
  rules: TaxRuleVersion
): number {
  const taxAtCurrent = computeTaxOnIncome(oldTaxableIncome, specialRateIncome, specialRateTaxRate, "OLD", ageCategory, rules);
  if (taxAtCurrent.finalAnnualTax <= newFinalTax) return 0;

  let lo = 0;
  let hi = oldTaxableIncome;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const tax = computeTaxOnIncome(
      clampNonNegative(oldTaxableIncome - mid),
      specialRateIncome,
      specialRateTaxRate,
      "OLD",
      ageCategory,
      rules
    ).finalAnnualTax;
    if (tax > newFinalTax) lo = mid;
    else hi = mid;
  }
  return round(hi);
}

// ---------------------------------------------------------------------------
// Full regime result + comparison
// ---------------------------------------------------------------------------

export type RegimeTaxResult = RegimeIncomeBuild &
  TaxOnIncomeResult & {
    totalTaxableIncome: number;
    effectiveTaxRate: number;
  };

export type TakeHomeBreakdown = {
  annualGrossCash: number;
  annualEmployeePf: number;
  annualEmployeeNps: number;
  annualProfessionalTax: number;
  annualTax: number;
  netAnnualTakeHome: number;
  netMonthlyTakeHome: number;
  employerPfAnnual: number;
  gratuityAnnual: number;
  employerNpsAnnual: number;
  otherEmployerCostAnnual: number;
};

export type MonthlyPayrollRow = {
  month: number;
  grossEarnings: number;
  exemptReimbursement: number;
  taxableEarnings: number;
  employeePf: number;
  employeeNps: number;
  professionalTax: number;
  tds: number;
  netTakeHome: number;
};

export type ComparisonResult = {
  rulesVersion: { financialYear: string; assessmentYear: string; sourceReference: string };
  ctc: CtcBreakdown;
  hraExemption: HraExemptionResult;
  old: RegimeTaxResult;
  new: RegimeTaxResult;
  recommendedRegime: TaxRegime;
  annualTaxSaving: number;
  monthlyTaxSaving: number;
  breakEvenOldRegimeDeductions: number;
  takeHome: Record<TaxRegime, TakeHomeBreakdown>;
  monthlySchedule: Record<TaxRegime, MonthlyPayrollRow[]>;
  validationErrors: string[];
};

function finalizeRegime(build: RegimeIncomeBuild, otherIncome: OtherIncomeInput, ageCategory: AgeCategory, rules: TaxRuleVersion): RegimeTaxResult {
  const tax = computeTaxOnIncome(
    build.totalTaxableIncomeBeforeSpecialRate,
    otherIncome.specialRateIncome,
    otherIncome.specialRateIncomeTaxRate,
    build.regime,
    ageCategory,
    rules
  );
  const totalTaxableIncome = build.totalTaxableIncomeBeforeSpecialRate + otherIncome.specialRateIncome;
  const effectiveTaxRate = totalTaxableIncome > 0 ? tax.finalAnnualTax / totalTaxableIncome : 0;
  return { ...build, ...tax, totalTaxableIncome, effectiveTaxRate };
}

function buildTakeHome(ctc: CtcBreakdown, regime: RegimeTaxResult, declarations: OldRegimeDeclarationInput): TakeHomeBreakdown {
  const annualGrossCash = ctc.cashComponentsTotal;
  const annualEmployeePf = ctc.employeePf;
  const annualEmployeeNps = regime.regime === "OLD" ? declarations.employeeNpsAdditional : 0;
  const annualProfessionalTax = regime.regime === "OLD" ? declarations.professionalTaxAnnual : 0;
  const annualTax = regime.finalAnnualTax;
  const netAnnualTakeHome = annualGrossCash - annualEmployeePf - annualEmployeeNps - annualProfessionalTax - annualTax;
  return {
    annualGrossCash,
    annualEmployeePf,
    annualEmployeeNps,
    annualProfessionalTax,
    annualTax,
    netAnnualTakeHome,
    netMonthlyTakeHome: round(netAnnualTakeHome / 12),
    employerPfAnnual: ctc.employerPf,
    gratuityAnnual: ctc.gratuity,
    employerNpsAnnual: ctc.employerNps,
    otherEmployerCostAnnual: ctc.otherEmployerCostTotal,
  };
}

function buildMonthlySchedule(
  ctc: CtcBreakdown,
  regime: RegimeTaxResult,
  profile: EmployeeProfile,
  declarations: OldRegimeDeclarationInput,
  tdsAlreadyDeducted: number
): MonthlyPayrollRow[] {
  const months = Math.max(1, Math.round(profile.payrollMonths));
  const remainingTax = clampNonNegative(regime.finalAnnualTax - tdsAlreadyDeducted);

  const annualExemptReimbursement = regime.regime === "OLD" ? regime.exemptAllowances : 0;
  const grossMonthly = round(ctc.cashComponentsTotal / months);
  const exemptMonthly = round(annualExemptReimbursement / months);
  const employeePfMonthly = round(ctc.employeePf / months);
  const employeeNpsMonthly = regime.regime === "OLD" ? round(declarations.employeeNpsAdditional / months) : 0;
  const professionalTaxMonthly = regime.regime === "OLD" ? round(declarations.professionalTaxAnnual / months) : 0;
  const tdsMonthlyBase = Math.floor(remainingTax / months);
  const tdsRemainder = remainingTax - tdsMonthlyBase * months;

  const rows: MonthlyPayrollRow[] = [];
  for (let m = 1; m <= months; m++) {
    const tds = m === months ? tdsMonthlyBase + tdsRemainder : tdsMonthlyBase;
    const taxableEarnings = grossMonthly - exemptMonthly;
    rows.push({
      month: m,
      grossEarnings: grossMonthly,
      exemptReimbursement: exemptMonthly,
      taxableEarnings,
      employeePf: employeePfMonthly,
      employeeNps: employeeNpsMonthly,
      professionalTax: professionalTaxMonthly,
      tds,
      netTakeHome: grossMonthly - employeePfMonthly - employeeNpsMonthly - professionalTaxMonthly - tds,
    });
  }
  return rows;
}

export function calculateFull(input: CalculatorInput): ComparisonResult {
  const rules = getTaxRules(input.profile.assessmentYear);
  const isMetro = input.profile.isMetro || isMetroCity(input.profile.city);

  const ctc = buildCtcStructure(input.ctc, input.profile, rules);
  const hraExemption = calculateHraExemption(ctc, input.oldRegimeDeclarations, isMetro, rules);

  const oldBuild = buildOldRegimeIncome(ctc, hraExemption, input.oldRegimeDeclarations, input.otherIncome, input.profile.ageCategory, rules);
  const newBuild = buildNewRegimeIncome(ctc, input.otherIncome, rules);

  const old = finalizeRegime(oldBuild, input.otherIncome, input.profile.ageCategory, rules);
  const newRegime = finalizeRegime(newBuild, input.otherIncome, input.profile.ageCategory, rules);

  const recommendedRegime: TaxRegime = old.finalAnnualTax <= newRegime.finalAnnualTax ? "OLD" : "NEW";
  const annualTaxSaving = Math.abs(old.finalAnnualTax - newRegime.finalAnnualTax);

  const breakEvenOldRegimeDeductions =
    recommendedRegime === "NEW"
      ? findBreakEvenAdditionalDeduction(
          old.totalTaxableIncomeBeforeSpecialRate,
          input.otherIncome.specialRateIncome,
          input.otherIncome.specialRateIncomeTaxRate,
          newRegime.finalAnnualTax,
          input.profile.ageCategory,
          rules
        )
      : 0;

  const validationErrors: string[] = [];
  if (input.ctc.totalAnnualCtc <= 0) validationErrors.push("Total CTC must be greater than zero.");
  if (!ctc.isBalanced) {
    validationErrors.push(
      `Salary structure exceeds CTC by ₹${Math.abs(ctc.shortfallOrExcess).toLocaleString("en-IN")}. Reduce an optional component, lower the Basic percentage, or increase CTC.`
    );
  }
  if (input.oldRegimeDeclarations.hasHraDeclaration && input.oldRegimeDeclarations.section80GG > 0) {
    validationErrors.push("Section 80GG cannot be claimed in the same period as HRA exemption — 80GG has been excluded from the old-regime calculation.");
  }
  if (input.oldRegimeDeclarations.ltaExemptAmount > ctc.lta) {
    validationErrors.push("LTA exempt amount cannot exceed LTA received — it has been capped at the amount received.");
  }

  return {
    rulesVersion: { financialYear: rules.financialYear, assessmentYear: rules.assessmentYear, sourceReference: rules.sourceReference },
    ctc,
    hraExemption,
    old,
    new: newRegime,
    recommendedRegime,
    annualTaxSaving,
    monthlyTaxSaving: round(annualTaxSaving / 12),
    breakEvenOldRegimeDeductions,
    takeHome: {
      OLD: buildTakeHome(ctc, old, input.oldRegimeDeclarations),
      NEW: buildTakeHome(ctc, newRegime, input.oldRegimeDeclarations),
    },
    monthlySchedule: {
      OLD: buildMonthlySchedule(ctc, old, input.profile, input.oldRegimeDeclarations, input.tdsAlreadyDeducted),
      NEW: buildMonthlySchedule(ctc, newRegime, input.profile, input.oldRegimeDeclarations, input.tdsAlreadyDeducted),
    },
    validationErrors,
  };
}

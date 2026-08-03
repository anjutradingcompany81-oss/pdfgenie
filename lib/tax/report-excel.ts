import * as XLSX from "xlsx";
import type { ComparisonResult, EmployeeProfile } from "./engine";

function sheetFromRows(rows: (string | number)[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(rows);
}

export function generateTaxExcelReport(result: ComparisonResult, profile: EmployeeProfile, employeeName: string): Uint8Array {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    ["Advanced CTC & Income Tax Report"],
    [employeeName || "", `FY ${result.rulesVersion.financialYear} (AY ${result.rulesVersion.assessmentYear})`],
    [`Generated ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Employee profile"],
    ["Age category", profile.ageCategory],
    ["Employer type", profile.employerCategory],
    ["Work city", profile.city],
    ["Payroll months", profile.payrollMonths],
    [],
    ["Recommendation"],
    ["Recommended regime", result.recommendedRegime],
    ["Annual tax saving", result.annualTaxSaving],
    ["Monthly tax saving", result.monthlyTaxSaving],
    [],
    ["Tax calculations are estimates based on the information entered and the tax rules configured for the selected year."],
    ["Users should verify the final tax position with official government guidance or a qualified tax professional."],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(summaryRows), "Summary");

  const ctcRows: (string | number)[][] = [
    ["CTC component", "Annual amount (Rs.)"],
    ["Basic Salary", result.ctc.basic],
    ["HRA", result.ctc.hra],
    ["Special Allowance", Math.max(0, result.ctc.specialAllowance)],
    ["Car Allowance", result.ctc.car],
    ["LTA", result.ctc.lta],
    ...result.ctc.dynamicComponents.map((c) => [`  — ${c.label}`, c.amount]),
    ["Employer PF", result.ctc.employerPf],
    ["Employee PF (deducted from salary)", result.ctc.employeePf],
    ["Gratuity", result.ctc.gratuity],
    ["Employer NPS", result.ctc.employerNps],
    ["Total Annual CTC", result.ctc.totalAnnualCtc],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(ctcRows), "CTC Structure");

  const comparisonRows: (string | number)[][] = [
    ["", "Old regime", "New regime"],
    ["Gross salary", result.old.grossSalary, result.new.grossSalary],
    ["Exempt allowances", result.old.exemptAllowances, result.new.exemptAllowances],
    ["Standard deduction", result.old.standardDeduction, result.new.standardDeduction],
    ["Chapter VI-A deductions", result.old.chapterVIADeductions, result.new.chapterVIADeductions],
    ["Total taxable income", result.old.totalTaxableIncome, result.new.totalTaxableIncome],
    ["Tax before rebate", result.old.taxBeforeRebate, result.new.taxBeforeRebate],
    ["Rebate (Sec 87A)", result.old.rebate, result.new.rebate],
    ["Surcharge", result.old.surcharge, result.new.surcharge],
    ["Marginal relief (surcharge)", result.old.marginalReliefSurcharge, result.new.marginalReliefSurcharge],
    ["Health & education cess", result.old.cess, result.new.cess],
    ["Final annual tax", result.old.finalAnnualTax, result.new.finalAnnualTax],
    ["Effective tax rate (%)", Math.round(result.old.effectiveTaxRate * 1000) / 10, Math.round(result.new.effectiveTaxRate * 1000) / 10],
    ["Net annual take-home", result.takeHome.OLD.netAnnualTakeHome, result.takeHome.NEW.netAnnualTakeHome],
    [],
    ["Chapter VI-A breakdown (old regime)", "Declared", "Allowed"],
    ...result.old.chapterVIABreakdown.map((d) => [d.label, d.claimed, d.allowed]),
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromRows(comparisonRows), "Regime Comparison");

  for (const regime of ["OLD", "NEW"] as const) {
    const rows: (string | number)[][] = [
      ["Month", "Gross earnings", "Exempt reimbursement", "Taxable earnings", "Employee PF", "Employee NPS", "Professional tax", "TDS", "Net take-home"],
      ...result.monthlySchedule[regime].map((row) => [
        row.month,
        row.grossEarnings,
        row.exemptReimbursement,
        row.taxableEarnings,
        row.employeePf,
        row.employeeNps,
        row.professionalTax,
        row.tds,
        row.netTakeHome,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, sheetFromRows(rows), `Monthly TDS - ${regime === "OLD" ? "Old" : "New"}`);
  }

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Uint8Array(out);
}

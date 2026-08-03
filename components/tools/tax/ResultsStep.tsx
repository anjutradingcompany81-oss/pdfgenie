"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, TrendingDown, AlertTriangle } from "lucide-react";
import type { ComparisonResult, TaxRegime } from "@/lib/tax/engine";
import { formatINR, formatPercent } from "@/lib/tax/format";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SectionCard, DonutChart, CompareBar, CtcBifurcationTable, buildCtcBifurcationSections } from "./shared";

function RegimeStat({ label, oldValue, newValue }: { label: string; oldValue: number; newValue: number }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b border-brand-brown-dark/5 py-2 text-sm last:border-0">
      <span className="text-brand-brown-dark/65">{label}</span>
      <span className="text-right font-medium text-brand-brown-dark">{formatINR(oldValue)}</span>
      <span className="text-right font-medium text-brand-brown-dark">{formatINR(newValue)}</span>
    </div>
  );
}

export function ResultsStep({
  result,
  employeeName,
  onEmployeeNameChange,
  onDownloadPdf,
  onDownloadExcel,
}: {
  result: ComparisonResult;
  employeeName: string;
  onEmployeeNameChange: (name: string) => void;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
}) {
  const [scheduleRegime, setScheduleRegime] = useState<TaxRegime>(result.recommendedRegime);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);

  const recommended = result[result.recommendedRegime === "OLD" ? "old" : "new"];
  const other = result[result.recommendedRegime === "OLD" ? "new" : "old"];

  const ctcBifurcationSections = buildCtcBifurcationSections(result.ctc);

  async function handleDownload(kind: "pdf" | "excel") {
    setDownloading(kind);
    try {
      if (kind === "pdf") await onDownloadPdf();
      else await onDownloadExcel();
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-5">
      {result.validationErrors.length > 0 && (
        <div className="rounded-2xl border border-status-danger/30 bg-status-danger/5 p-4">
          {result.validationErrors.map((err) => (
            <p key={err} className="flex items-start gap-2 text-sm text-status-danger">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {err}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <TrendingDown size={14} />
          Recommended: {result.recommendedRegime === "OLD" ? "Old regime" : "New regime"}
        </p>
        <p className="mt-2 text-3xl font-bold text-brand-brown-dark">
          {formatINR(result.annualTaxSaving)} <span className="text-base font-medium text-brand-brown-dark/60">saved annually</span>
        </p>
        <p className="mt-1 text-sm text-brand-brown-dark/65">
          {formatINR(result.monthlyTaxSaving)}/month less tax than the {result.recommendedRegime === "OLD" ? "new" : "old"} regime — final tax{" "}
          {formatINR(recommended.finalAnnualTax)} vs {formatINR(other.finalAnnualTax)}.
        </p>
        {result.recommendedRegime === "NEW" && result.breakEvenOldRegimeDeductions > 0 && (
          <p className="mt-2 text-xs text-brand-brown-dark/55">
            The old regime would only break even if you could additionally deduct {formatINR(result.breakEvenOldRegimeDeductions)} beyond what&apos;s
            declared.
          </p>
        )}
        <p className="mt-3 text-xs text-brand-brown-dark/50">
          Estimate only, based on the information entered and AY {result.rulesVersion.assessmentYear} rules ({result.rulesVersion.sourceReference}).
          Verify with official guidance or a qualified tax professional before filing.
        </p>
      </div>

      <SectionCard title="Old vs. new regime — full comparison">
        <div className="grid grid-cols-3 gap-2 border-b border-brand-brown-dark/10 pb-2 text-xs font-semibold uppercase tracking-wide text-brand-brown-dark/50">
          <span></span>
          <span className="text-right">Old regime</span>
          <span className="text-right">New regime</span>
        </div>
        <RegimeStat label="Gross salary" oldValue={result.old.grossSalary} newValue={result.new.grossSalary} />
        <RegimeStat label="Exempt allowances" oldValue={result.old.exemptAllowances} newValue={result.new.exemptAllowances} />
        <RegimeStat label="Standard deduction" oldValue={result.old.standardDeduction} newValue={result.new.standardDeduction} />
        <RegimeStat label="Chapter VI-A deductions" oldValue={result.old.chapterVIADeductions} newValue={result.new.chapterVIADeductions} />
        <RegimeStat label="Total taxable income" oldValue={result.old.totalTaxableIncome} newValue={result.new.totalTaxableIncome} />
        <RegimeStat label="Tax before rebate" oldValue={result.old.taxBeforeRebate} newValue={result.new.taxBeforeRebate} />
        <RegimeStat label="Rebate (87A)" oldValue={result.old.rebate} newValue={result.new.rebate} />
        <RegimeStat label="Surcharge" oldValue={result.old.surcharge} newValue={result.new.surcharge} />
        <RegimeStat label="Health & education cess" oldValue={result.old.cess} newValue={result.new.cess} />
        <RegimeStat label="Final annual tax" oldValue={result.old.finalAnnualTax} newValue={result.new.finalAnnualTax} />
        <RegimeStat label="Monthly TDS (avg.)" oldValue={Math.round(result.old.finalAnnualTax / 12)} newValue={Math.round(result.new.finalAnnualTax / 12)} />
        <div className="grid grid-cols-3 items-center gap-2 pt-2 text-sm">
          <span className="text-brand-brown-dark/65">Effective tax rate</span>
          <span className="text-right font-medium text-brand-brown-dark">{formatPercent(result.old.effectiveTaxRate)}</span>
          <span className="text-right font-medium text-brand-brown-dark">{formatPercent(result.new.effectiveTaxRate)}</span>
        </div>
      </SectionCard>

      <div className="grid gap-5 sm:grid-cols-2">
        <SectionCard title="CTC composition">
          <DonutChart
            segments={[
              { label: "Basic + HRA", value: result.ctc.basic + result.ctc.hra },
              { label: "Special Allowance", value: Math.max(0, result.ctc.specialAllowance) },
              { label: "Car + LTA", value: result.ctc.car + result.ctc.lta },
              {
                label: "Other components",
                value: result.ctc.dynamicComponents
                  .filter((c) => c.category === "FIXED" || c.category === "REIMBURSEMENT")
                  .reduce((sum, c) => sum + c.amount, 0),
              },
              { label: "Retirals", value: result.ctc.totalEmployerRetirals },
              { label: "Other employer cost", value: result.ctc.otherEmployerCostTotal },
            ]}
          />
        </SectionCard>
        <SectionCard title="Take-home comparison (annual)">
          <div className="space-y-4">
            <CompareBar
              label="Net take-home"
              valueA={result.takeHome.OLD.netAnnualTakeHome}
              valueB={result.takeHome.NEW.netAnnualTakeHome}
              labelA="Old"
              labelB="New"
              format={formatINR}
            />
            <CompareBar label="Final tax" valueA={result.old.finalAnnualTax} valueB={result.new.finalAnnualTax} labelA="Old" labelB="New" format={formatINR} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="CTC bifurcation" description="Every component that makes up the total, grouped the way a payroll sheet would show it.">
        <CtcBifurcationTable sections={ctcBifurcationSections} total={result.ctc.totalAnnualCtc} format={formatINR} />
      </SectionCard>

      <SectionCard title="Why CTC ≠ gross salary ≠ take-home">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-brand-brown-dark">Total CTC</p>
            <p className="text-lg font-bold text-brand-brown-dark">{formatINR(result.ctc.totalAnnualCtc)}</p>
            <p className="text-xs text-brand-brown-dark/55">Includes employer PF, gratuity, NPS & other costs never paid to you as cash.</p>
          </div>
          <div>
            <p className="font-semibold text-brand-brown-dark">Gross salary ({result.recommendedRegime === "OLD" ? "old" : "new"} regime)</p>
            <p className="text-lg font-bold text-brand-brown-dark">{formatINR(recommended.grossSalary)}</p>
            <p className="text-xs text-brand-brown-dark/55">Cash + taxable perquisites — before exemptions, deductions, and tax.</p>
          </div>
          <div>
            <p className="font-semibold text-brand-brown-dark">Net annual take-home</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatINR(result.takeHome[result.recommendedRegime].netAnnualTakeHome)}
            </p>
            <p className="text-xs text-brand-brown-dark/55">After employee PF, NPS, professional tax, and income tax.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Monthly payroll projection">
        <div className="mb-3 inline-flex rounded-full border border-brand-brown-dark/10 p-1">
          {(["OLD", "NEW"] as TaxRegime[]).map((r) => (
            <button
              key={r}
              type="button"
              data-hover="true"
              onClick={() => setScheduleRegime(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                scheduleRegime === r ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/70"
              }`}
            >
              {r === "OLD" ? "Old regime" : "New regime"}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-brand-brown-dark/10 text-left text-xs font-semibold uppercase tracking-wide text-brand-brown-dark/50">
                <th className="py-2 pr-2">Month</th>
                <th className="py-2 pr-2 text-right">Gross</th>
                <th className="py-2 pr-2 text-right">Exempt</th>
                <th className="py-2 pr-2 text-right">Employee PF</th>
                <th className="py-2 pr-2 text-right">Prof. tax</th>
                <th className="py-2 pr-2 text-right">TDS</th>
                <th className="py-2 pr-2 text-right">Net take-home</th>
              </tr>
            </thead>
            <tbody>
              {result.monthlySchedule[scheduleRegime].map((row) => (
                <tr key={row.month} className="border-b border-brand-brown-dark/5 last:border-0">
                  <td className="py-2 pr-2 text-brand-brown-dark/70">Month {row.month}</td>
                  <td className="py-2 pr-2 text-right">{formatINR(row.grossEarnings)}</td>
                  <td className="py-2 pr-2 text-right">{formatINR(row.exemptReimbursement)}</td>
                  <td className="py-2 pr-2 text-right">{formatINR(row.employeePf)}</td>
                  <td className="py-2 pr-2 text-right">{formatINR(row.professionalTax)}</td>
                  <td className="py-2 pr-2 text-right">{formatINR(row.tds)}</td>
                  <td className="py-2 pr-2 text-right font-semibold text-brand-brown-dark">{formatINR(row.netTakeHome)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Download report">
        <label className="mb-4 block max-w-xs">
          <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">Name for report (optional)</span>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => onEmployeeNameChange(e.target.value)}
            placeholder="Not required"
            className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <MagneticButton onClick={() => handleDownload("pdf")} disabled={downloading !== null}>
            <Download size={16} />
            {downloading === "pdf" ? "Preparing…" : "Download PDF report"}
          </MagneticButton>
          <MagneticButton variant="outline" onClick={() => handleDownload("excel")} disabled={downloading !== null}>
            <FileSpreadsheet size={16} />
            {downloading === "excel" ? "Preparing…" : "Download Excel workbook"}
          </MagneticButton>
        </div>
      </SectionCard>
    </div>
  );
}

"use client";

import { Calculator, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { TaxStepper, type TaxStepId } from "@/components/tools/tax/TaxStepper";
import { ProfileStep } from "@/components/tools/tax/ProfileStep";
import { CtcStructureStep } from "@/components/tools/tax/CtcStructureStep";
import { DeclarationsStep } from "@/components/tools/tax/DeclarationsStep";
import { ResultsStep } from "@/components/tools/tax/ResultsStep";
import { calculateFull, createDefaultInput, buildCtcStructure } from "@/lib/tax/engine";
import { getTaxRules, isMetroCity } from "@/lib/tax/rules";
import { generateTaxPdfReport } from "@/lib/tax/report-pdf";
import { generateTaxExcelReport } from "@/lib/tax/report-excel";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const STEP_ORDER: TaxStepId[] = ["profile", "ctc", "declarations", "results"];

export default function IncomeTaxCalculatorClient() {
  const [step, setStep] = useState<TaxStepId>("profile");
  const [input, setInput] = useState(createDefaultInput());
  const [employeeName, setEmployeeName] = useState("");

  const result = useMemo(() => calculateFull(input), [input]);
  const rules = useMemo(() => getTaxRules(input.profile.assessmentYear), [input.profile.assessmentYear]);
  const ctcPreview = useMemo(() => buildCtcStructure(input.ctc, input.profile, rules), [input.ctc, input.profile, rules]);

  const stepIndex = STEP_ORDER.indexOf(step);

  function goNext() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1];
    if (prev) setStep(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDownloadPdf() {
    const bytes = await generateTaxPdfReport(result, input.profile, employeeName);
    downloadBlob(bytesToBlob(bytes, "application/pdf"), "Income-Tax-Report.pdf");
  }

  function handleDownloadExcel() {
    const bytes = generateTaxExcelReport(result, input.profile, employeeName);
    downloadBlob(bytesToBlob(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"), "Income-Tax-Report.xlsx");
  }

  return (
    <ToolShell
      icon={Calculator}
      title="Income Tax Calculator"
      description="Build your CTC structure, compare the old and new tax regimes for AY 2026-27, and see your real take-home pay."
    >
      <div className="mb-6">
        <TaxStepper current={step} onJump={setStep} />
      </div>

      {step === "profile" && (
        <ProfileStep
          profile={input.profile}
          onChange={(profile) => setInput((prev) => ({ ...prev, profile: { ...profile, isMetro: profile.isMetro || isMetroCity(profile.city) } }))}
        />
      )}

      {step === "ctc" && (
        <CtcStructureStep ctc={input.ctc} breakdown={ctcPreview} onChange={(ctc) => setInput((prev) => ({ ...prev, ctc }))} />
      )}

      {step === "declarations" && (
        <DeclarationsStep
          declarations={input.oldRegimeDeclarations}
          onChangeDeclarations={(oldRegimeDeclarations) => setInput((prev) => ({ ...prev, oldRegimeDeclarations }))}
          otherIncome={input.otherIncome}
          onChangeOtherIncome={(otherIncome) => setInput((prev) => ({ ...prev, otherIncome }))}
          tdsAlreadyDeducted={input.tdsAlreadyDeducted}
          onChangeTds={(tdsAlreadyDeducted) => setInput((prev) => ({ ...prev, tdsAlreadyDeducted }))}
          employeePf={ctcPreview.employeePf}
          hraExemptAmount={result.hraExemption.exemptAmount}
          ltaReceived={ctcPreview.lta}
        />
      )}

      {step === "results" && (
        <ResultsStep
          result={result}
          employeeName={employeeName}
          onEmployeeNameChange={setEmployeeName}
          onDownloadPdf={handleDownloadPdf}
          onDownloadExcel={handleDownloadExcel}
        />
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          data-hover="true"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-brown-dark/70 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        {stepIndex < STEP_ORDER.length - 1 && (
          <MagneticButton onClick={goNext}>
            Next
            <ChevronRight size={16} />
          </MagneticButton>
        )}
      </div>
    </ToolShell>
  );
}

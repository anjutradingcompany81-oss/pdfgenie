import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ComparisonResult, EmployeeProfile } from "./engine";
import { formatIndianNumber } from "./format";

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const INK = rgb(0.09, 0.075, 0.06);
const MUTED = rgb(0.45, 0.4, 0.35);
const ACCENT = rgb(0.09, 0.35, 0.75);

class ReportBuilder {
  doc!: PDFDocument;
  font!: PDFFont;
  boldFont!: PDFFont;
  page!: PDFPage;
  y = 0;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  title(text: string) {
    this.ensureSpace(30);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 20, font: this.boldFont, color: ACCENT });
    this.y -= 28;
  }

  subtitle(text: string) {
    this.ensureSpace(16);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 10, font: this.font, color: MUTED });
    this.y -= 20;
  }

  heading(text: string) {
    this.ensureSpace(26);
    this.y -= 8;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 13, font: this.boldFont, color: INK });
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color: rgb(0.85, 0.82, 0.78),
    });
    this.y -= 14;
  }

  row(label: string, value: string, opts?: { bold?: boolean }) {
    this.ensureSpace(16);
    this.page.drawText(label, { x: MARGIN, y: this.y, size: 9.5, font: this.font, color: INK });
    this.page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - this.font.widthOfTextAtSize(value, 9.5),
      y: this.y,
      size: 9.5,
      font: opts?.bold ? this.boldFont : this.font,
      color: INK,
    });
    this.y -= 15;
  }

  paragraph(text: string, size = 8.5) {
    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (this.font.widthOfTextAtSize(candidate, size) > maxWidth) {
        this.ensureSpace(13);
        this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: MUTED });
        this.y -= 12;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      this.ensureSpace(13);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: MUTED });
      this.y -= 12;
    }
  }

  spacer(height = 10) {
    this.y -= height;
  }

  tableHeader(cols: { label: string; x: number }[]) {
    this.ensureSpace(18);
    for (const c of cols) {
      this.page.drawText(c.label, { x: c.x, y: this.y, size: 8.5, font: this.boldFont, color: MUTED });
    }
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.5,
      color: rgb(0.85, 0.82, 0.78),
    });
    this.y -= 12;
  }

  tableRow(cells: { text: string; x: number }[]) {
    this.ensureSpace(14);
    for (const c of cells) {
      this.page.drawText(c.text, { x: c.x, y: this.y, size: 8.5, font: this.font, color: INK });
    }
    this.y -= 13;
  }

  async finish(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    pages.forEach((p, i) => {
      const label = `Page ${i + 1} of ${pages.length}`;
      p.drawText(label, {
        x: PAGE_WIDTH - MARGIN - this.font.widthOfTextAtSize(label, 8),
        y: MARGIN / 2,
        size: 8,
        font: this.font,
        color: MUTED,
      });
      p.drawText("PDF Genie — Income Tax Calculator", { x: MARGIN, y: MARGIN / 2, size: 8, font: this.font, color: MUTED });
    });
    return this.doc.save();
  }
}

function inr(n: number): string {
  return `Rs. ${formatIndianNumber(n)}`;
}

export async function generateTaxPdfReport(result: ComparisonResult, profile: EmployeeProfile, employeeName: string): Promise<Uint8Array> {
  const r = new ReportBuilder();
  await r.init();

  r.title("Advanced CTC & Income Tax Report");
  r.subtitle(
    `${employeeName ? `${employeeName} · ` : ""}FY ${result.rulesVersion.financialYear} (AY ${result.rulesVersion.assessmentYear}) · Generated ${new Date().toLocaleString("en-IN")}`
  );

  r.heading("Employee & assumptions");
  r.row("Age category", profile.ageCategory.replace(/_/g, " "));
  r.row("Employer type", profile.employerCategory);
  r.row("Work city", `${profile.city}${profile.isMetro ? " (metro)" : ""}`);
  r.row("Payroll months this FY", String(profile.payrollMonths));
  r.row("Recommended regime", result.recommendedRegime === "OLD" ? "Old regime" : "New regime", { bold: true });

  r.heading("CTC structure (annual)");
  r.row("Basic Salary", inr(result.ctc.basic));
  r.row("HRA", inr(result.ctc.hra));
  r.row("Special Allowance", inr(Math.max(0, result.ctc.specialAllowance)));
  r.row("Variable Pay + Bonus", inr(result.ctc.variablePay + result.ctc.bonus));
  r.row("Dearness Allowance + Other Allowance", inr(result.ctc.dearnessAllowance + result.ctc.otherAllowance));
  r.row("Reimbursements (total)", inr(result.ctc.reimbursementsTotal));
  r.row("Employer PF", inr(result.ctc.employerPf));
  r.row("Gratuity", inr(result.ctc.gratuity));
  r.row("Employer NPS", inr(result.ctc.employerNps));
  r.row("Superannuation", inr(result.ctc.superannuation));
  r.row("Other employer cost", inr(result.ctc.otherEmployerCost));
  r.row("Total Annual CTC", inr(result.ctc.totalAnnualCtc), { bold: true });

  r.heading("Old regime vs. new regime");
  const cols = [
    { label: "", x: MARGIN },
    { label: "Old regime", x: MARGIN + 300 },
    { label: "New regime", x: MARGIN + 420 },
  ];
  r.tableHeader(cols);
  const lines: [string, string, string][] = [
    ["Gross salary", inr(result.old.grossSalary), inr(result.new.grossSalary)],
    ["Exempt allowances", inr(result.old.exemptAllowances), inr(result.new.exemptAllowances)],
    ["Standard deduction", inr(result.old.standardDeduction), inr(result.new.standardDeduction)],
    ["Chapter VI-A deductions", inr(result.old.chapterVIADeductions), inr(result.new.chapterVIADeductions)],
    ["Total taxable income", inr(result.old.totalTaxableIncome), inr(result.new.totalTaxableIncome)],
    ["Tax before rebate", inr(result.old.taxBeforeRebate), inr(result.new.taxBeforeRebate)],
    ["Rebate (Sec 87A)", inr(result.old.rebate), inr(result.new.rebate)],
    ["Surcharge", inr(result.old.surcharge), inr(result.new.surcharge)],
    ["Health & education cess", inr(result.old.cess), inr(result.new.cess)],
    ["Final annual tax", inr(result.old.finalAnnualTax), inr(result.new.finalAnnualTax)],
    ["Net annual take-home", inr(result.takeHome.OLD.netAnnualTakeHome), inr(result.takeHome.NEW.netAnnualTakeHome)],
  ];
  for (const [label, a, b] of lines) {
    r.tableRow([
      { text: label, x: MARGIN },
      { text: a, x: MARGIN + 300 },
      { text: b, x: MARGIN + 420 },
    ]);
  }

  r.spacer(10);
  r.row("Annual tax saving with recommended regime", inr(result.annualTaxSaving), { bold: true });

  r.heading("HRA exemption (old regime)");
  r.row("HRA received", inr(result.hraExemption.hraReceived));
  r.row("Rent paid", inr(result.hraExemption.rentPaid));
  r.row("Exempt amount", inr(result.hraExemption.exemptAmount));
  r.row("Taxable amount", inr(result.hraExemption.taxableAmount));

  r.heading(`Chapter VI-A deductions — old regime (declared / allowed)`);
  const chapterCols = [
    { label: "Section", x: MARGIN },
    { label: "Declared", x: MARGIN + 300 },
    { label: "Allowed", x: MARGIN + 420 },
  ];
  r.tableHeader(chapterCols);
  for (const d of result.old.chapterVIABreakdown) {
    r.tableRow([
      { text: d.label, x: MARGIN },
      { text: inr(d.claimed), x: MARGIN + 300 },
      { text: inr(d.allowed), x: MARGIN + 420 },
    ]);
  }

  r.heading("Monthly payroll projection — recommended regime");
  const monthCols = [
    { label: "Month", x: MARGIN },
    { label: "Gross", x: MARGIN + 90 },
    { label: "Employee PF", x: MARGIN + 190 },
    { label: "TDS", x: MARGIN + 310 },
    { label: "Net take-home", x: MARGIN + 410 },
  ];
  r.tableHeader(monthCols);
  for (const row of result.monthlySchedule[result.recommendedRegime]) {
    r.tableRow([
      { text: `Month ${row.month}`, x: MARGIN },
      { text: inr(row.grossEarnings), x: MARGIN + 90 },
      { text: inr(row.employeePf), x: MARGIN + 190 },
      { text: inr(row.tds), x: MARGIN + 310 },
      { text: inr(row.netTakeHome), x: MARGIN + 410 },
    ]);
  }

  r.heading("Assumptions & disclaimer");
  r.paragraph(
    `Rule source: ${result.rulesVersion.sourceReference}. LTA and other reimbursements are only treated as exempt to the extent declared and substantiated — nothing is assumed exempt by default. Employer PF, NPS, and superannuation contributions above Rs. 7,50,000 combined are added back as a taxable perquisite. The monthly schedule assumes the remaining tax is spread evenly across the remaining payroll months of the year.`
  );
  r.spacer(4);
  r.paragraph(
    "Tax calculations are estimates based on the information entered and the tax rules configured for the selected year. Users should verify the final tax position with official government guidance or a qualified tax professional."
  );

  return await r.finish();
}

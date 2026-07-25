import * as XLSX from "xlsx";
import type { RowProblem } from "@/lib/mail-merge/parse-recipients";

export type ValidationReportRow = {
  category: "Email problem" | "Missing attachment" | "Extra attachment" | "Duplicate attachment";
  row: string;
  email: string;
  detail: string;
};

export function buildValidationReportRows(input: {
  problems: RowProblem[];
  attachmentIssues: { email: string; missing: string[] }[];
  extraFiles: string[];
  duplicateFiles: string[];
}): ValidationReportRow[] {
  const rows: ValidationReportRow[] = [];

  for (const p of input.problems) {
    rows.push({
      category: "Email problem",
      row: String(p.row),
      email: p.raw["Email"] ?? "",
      detail: p.message,
    });
  }

  for (const issue of input.attachmentIssues) {
    rows.push({
      category: "Missing attachment",
      row: "",
      email: issue.email,
      detail: `References file(s) not uploaded: ${issue.missing.join(", ")}`,
    });
  }

  for (const file of input.extraFiles) {
    rows.push({ category: "Extra attachment", row: "", email: "", detail: `${file} isn't referenced by any recipient.` });
  }

  for (const file of input.duplicateFiles) {
    rows.push({ category: "Duplicate attachment", row: "", email: "", detail: `${file} was uploaded more than once.` });
  }

  return rows;
}

function toLabeledRows(rows: ValidationReportRow[]): Record<string, string>[] {
  return rows.map((r) => ({
    Category: r.category,
    Row: r.row,
    Email: r.email,
    Detail: r.detail,
  }));
}

export function validationReportToXlsx(rows: ValidationReportRow[]): Uint8Array {
  const ws = XLSX.utils.json_to_sheet(toLabeledRows(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Validation Report");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

export function validationReportToCsv(rows: ValidationReportRow[]): string {
  const ws = XLSX.utils.json_to_sheet(toLabeledRows(rows));
  return XLSX.utils.sheet_to_csv(ws);
}

export function validationReportToJson(rows: ValidationReportRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function downloadValidationReport(rows: ValidationReportRow[], format: "xlsx" | "csv" | "json") {
  let blob: Blob;
  let filename: string;
  if (format === "xlsx") {
    blob = new Blob([validationReportToXlsx(rows) as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    filename = "validation-report.xlsx";
  } else if (format === "csv") {
    blob = new Blob([validationReportToCsv(rows)], { type: "text/csv" });
    filename = "validation-report.csv";
  } else {
    blob = new Blob([validationReportToJson(rows)], { type: "application/json" });
    filename = "validation-report.json";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

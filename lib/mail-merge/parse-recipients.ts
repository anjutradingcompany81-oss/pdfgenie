import * as XLSX from "xlsx";

export type Recipient = {
  email: string;
  fields: Record<string, string>;
};

export type RowProblemType = "INVALID_EMAIL" | "MISSING_EMAIL" | "DUPLICATE_EMAIL";

export type RowProblem = {
  row: number;
  raw: Record<string, string>;
  type: RowProblemType;
  message: string;
};

export type ParsedRecipients = {
  valid: Recipient[];
  problems: RowProblem[];
  columns: string[];
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRecipientsFile(buffer: ArrayBuffer): ParsedRecipients {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("That file doesn't have any sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (rows.length === 0) {
    throw new Error("That file doesn't have any rows.");
  }

  const columns = Object.keys(rows[0]);
  const emailColumn = columns.find((c) => c.trim().toLowerCase() === "email");
  if (!emailColumn) {
    throw new Error('No "Email" column found. Add a column named "Email" with each recipient\'s address.');
  }

  const valid: Recipient[] = [];
  const problems: RowProblem[] = [];
  const seenEmails = new Set<string>();

  rows.forEach((row, index) => {
    // Header is row 1, data starts at row 2 in the source Excel file.
    const rowNumber = index + 2;
    const fields: Record<string, string> = {};
    for (const col of columns) {
      fields[col] = String(row[col] ?? "");
    }

    const email = String(row[emailColumn] ?? "").trim();
    if (!email) {
      problems.push({ row: rowNumber, raw: fields, type: "MISSING_EMAIL", message: "No email address in this row." });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      problems.push({
        row: rowNumber,
        raw: fields,
        type: "INVALID_EMAIL",
        message: `"${email}" doesn't look like a valid email address.`,
      });
      return;
    }
    const key = email.toLowerCase();
    if (seenEmails.has(key)) {
      problems.push({ row: rowNumber, raw: fields, type: "DUPLICATE_EMAIL", message: `"${email}" appears more than once.` });
      return;
    }
    seenEmails.add(key);
    valid.push({ email, fields });
  });

  if (valid.length === 0) {
    throw new Error("No valid recipient rows found.");
  }

  return { valid, problems, columns };
}

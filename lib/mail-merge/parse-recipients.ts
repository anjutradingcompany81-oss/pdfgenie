import * as XLSX from "xlsx";

export type Recipient = {
  email: string;
  fields: Record<string, string>;
};

export type ParsedRecipients = {
  recipients: Recipient[];
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

  const recipients: Recipient[] = [];
  for (const row of rows) {
    const email = String(row[emailColumn] ?? "").trim();
    if (!email) continue;
    if (!EMAIL_REGEX.test(email)) {
      throw new Error(`"${email}" doesn't look like a valid email address.`);
    }

    const fields: Record<string, string> = {};
    for (const col of columns) {
      fields[col] = String(row[col] ?? "");
    }
    recipients.push({ email, fields });
  }

  if (recipients.length === 0) {
    throw new Error("No valid recipient rows found.");
  }

  return { recipients, columns };
}

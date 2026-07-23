/** Case-insensitive lookup of a column value from a recipient's field map. */
export function findField(fields: Record<string, string>, name: string): string | undefined {
  const target = name.trim().toLowerCase();
  for (const [key, value] of Object.entries(fields)) {
    if (key.trim().toLowerCase() === target) return value;
  }
  return undefined;
}

function currentDate(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Replaces {{Field}} placeholders (case-insensitive) with values from a
 * recipient row. {{Current Date}} is computed rather than read from the
 * spreadsheet, since it's never a real column.
 */
export function renderTemplate(template: string, fields: Record<string, string>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawKey: string) => {
    const key = rawKey.trim();
    if (key.toLowerCase() === "current date") return currentDate();

    const value = findField(fields, key);
    return value !== undefined ? value : match;
  });
}

/** Merge fields available in a parsed recipient list, formatted for the template-help UI. */
export function extractMergeFields(columns: string[]): string[] {
  return [...columns.map((c) => `{{${c}}}`), "{{Current Date}}"];
}

/** Masks values in fields whose column name looks like a password, for logs/exports. */
export function maskSensitiveFields(fields: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    masked[key] = /password/i.test(key) && value ? "••••••" : value;
  }
  return masked;
}

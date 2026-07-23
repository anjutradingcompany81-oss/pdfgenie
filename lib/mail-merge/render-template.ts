/** Replaces {{FieldName}} placeholders (case-insensitive) with values from a recipient row. */
export function renderTemplate(template: string, fields: Record<string, string>): string {
  const lowerFields = new Map(Object.entries(fields).map(([k, v]) => [k.trim().toLowerCase(), v]));

  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawKey: string) => {
    const value = lowerFields.get(rawKey.trim().toLowerCase());
    return value !== undefined ? value : match;
  });
}

/** Merge fields available in a parsed recipient list, formatted for the template-help UI. */
export function extractMergeFields(columns: string[]): string[] {
  return columns.map((c) => `{{${c}}}`);
}

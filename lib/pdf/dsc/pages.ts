export type PageSelectionMode =
  | "all"
  | "even"
  | "odd"
  | "first"
  | "last"
  | "specific"
  | "range"
  | "everyN";

export type PageSelection = {
  mode: PageSelectionMode;
  /** 1-based page numbers, comma-separated in the UI (e.g. "1,4,7"). */
  specificPages?: string;
  rangeFrom?: number;
  rangeTo?: number;
  everyN?: number;
};

/** Returns 0-based page indices, in order, deduped, clamped to the document. */
export function resolvePageIndices(selection: PageSelection, pageCount: number): number[] {
  const all = Array.from({ length: pageCount }, (_, i) => i);
  if (pageCount === 0) return [];

  switch (selection.mode) {
    case "all":
      return all;
    case "even":
      return all.filter((i) => (i + 1) % 2 === 0);
    case "odd":
      return all.filter((i) => (i + 1) % 2 !== 0);
    case "first":
      return [0];
    case "last":
      return [pageCount - 1];
    case "specific": {
      const nums = (selection.specificPages ?? "")
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= pageCount)
        .map((n) => n - 1);
      return Array.from(new Set(nums)).sort((a, b) => a - b);
    }
    case "range": {
      const from = Math.max(1, selection.rangeFrom ?? 1);
      const to = Math.min(pageCount, selection.rangeTo ?? pageCount);
      if (from > to) return [];
      return all.slice(from - 1, to);
    }
    case "everyN": {
      const n = Math.max(1, selection.everyN ?? 1);
      return all.filter((i) => (i + 1) % n === 0 || i === 0);
    }
    default:
      return all;
  }
}

export function describeSelection(selection: PageSelection, pageCount: number): string {
  const count = resolvePageIndices(selection, pageCount).length;
  return `${count} of ${pageCount} page${pageCount === 1 ? "" : "s"} will be signed`;
}

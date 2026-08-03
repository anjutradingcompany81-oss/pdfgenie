import { diffWords, type Change } from "diff";
import { loadPdfjs } from "@/lib/pdf/pdfjs";

export type PageComparison = {
  pageIndex: number;
  status: "same" | "changed" | "added" | "removed";
  changes: Change[];
  hasText: boolean;
};

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export async function extractPageTexts(bytes: ArrayBuffer): Promise<string[]> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const doc = await loadingTask.promise;

  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    texts.push(text);
  }

  await loadingTask.destroy();
  return texts;
}

export async function comparePdfs(
  bytesA: ArrayBuffer,
  bytesB: ArrayBuffer
): Promise<PageComparison[]> {
  const [textsA, textsB] = await Promise.all([
    extractPageTexts(bytesA),
    extractPageTexts(bytesB),
  ]);

  const maxPages = Math.max(textsA.length, textsB.length);
  const results: PageComparison[] = [];

  for (let i = 0; i < maxPages; i++) {
    const a = textsA[i];
    const b = textsB[i];

    if (a === undefined) {
      results.push({
        pageIndex: i,
        status: "added",
        changes: [{ value: b, added: true, removed: false, count: wordCount(b) }],
        hasText: b.length > 0,
      });
      continue;
    }
    if (b === undefined) {
      results.push({
        pageIndex: i,
        status: "removed",
        changes: [{ value: a, added: false, removed: true, count: wordCount(a) }],
        hasText: a.length > 0,
      });
      continue;
    }
    if (a === b) {
      results.push({ pageIndex: i, status: "same", changes: [], hasText: a.length > 0 });
      continue;
    }
    results.push({
      pageIndex: i,
      status: "changed",
      changes: diffWords(a, b),
      hasText: a.length > 0 || b.length > 0,
    });
  }

  return results;
}

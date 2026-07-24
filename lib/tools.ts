import type { Tool } from "@/components/tools/ToolCard";
import { CORE_TOOLS, ORGANIZE_TOOLS, CONVERT_TOOLS, AUTOMATE_TOOLS, MORE_TOOLS } from "@/lib/tools-catalog";

export type ToolCategory = {
  category: string;
  tools: Tool[];
};

const ALL_CATALOG_TOOLS = [
  ...CORE_TOOLS,
  ...ORGANIZE_TOOLS,
  ...CONVERT_TOOLS,
  ...AUTOMATE_TOOLS,
  ...MORE_TOOLS,
];

/** Looks up a tool by href from the catalog, so nav/search reuse the same icon+copy defined once in lib/tools-catalog.ts rather than duplicating it. */
function tool(href: string): Tool {
  const found = ALL_CATALOG_TOOLS.find((t) => t.href === href);
  if (!found) throw new Error(`lib/tools.ts references a tool href not in lib/tools-catalog.ts: ${href}`);
  return found;
}

/** Nav/search category grouping — a different, purpose-specific view of the
 * same tools shown on /tools and the homepage (which use their own
 * Core/Organize/Convert/Automate sections). */
export const toolCategories: ToolCategory[] = [
  {
    category: "PDF Tools",
    tools: [
      tool("/tools/merge"),
      tool("/tools/split"),
      tool("/tools/compress"),
      tool("/tools/rotate-pdf"),
      tool("/tools/add-watermark"),
      tool("/tools/resize-pdf"),
      tool("/tools/add-text"),
      tool("/tools/sign"),
      tool("/tools/insert-pages"),
      tool("/tools/remove-pages"),
      tool("/tools/delete-pages"),
      tool("/tools/edit-pdf"),
      tool("/tools/fill-pdf"),
      tool("/tools/organize-pdf"),
      tool("/tools/crop-pdf"),
      tool("/tools/remove-watermark"),
    ],
  },
  {
    category: "Convert Tools",
    tools: [
      tool("/tools/convert"),
      tool("/tools/image-to-pdf"),
      tool("/tools/pdf-to-jpg"),
      tool("/tools/pdf-to-png"),
      tool("/tools/pdf-to-text"),
      tool("/tools/text-to-pdf"),
      tool("/tools/extract-images"),
      tool("/tools/word-to-pdf"),
      tool("/tools/pdf-to-word"),
      tool("/tools/pdf-to-excel"),
      tool("/tools/excel-to-pdf"),
      tool("/tools/ocr-pdf"),
      tool("/tools/image-to-text"),
      tool("/tools/jpg-to-pdf"),
    ],
  },
  {
    category: "Email Tools",
    tools: [tool("/tools/mail-merge")],
  },
  {
    category: "Security",
    tools: [tool("/tools/add-password"), tool("/tools/remove-password"), tool("/tools/encrypt")],
  },
  {
    category: "More Tools",
    tools: [
      tool("/tools/merge-images"),
      tool("/tools/compress-images"),
      tool("/tools/enhance-images"),
      tool("/tools/qr-code-generator"),
      tool("/tools/jpg-to-png"),
      tool("/tools/resize-jpg"),
      tool("/tools/compress-jpg"),
      tool("/tools/compress-video"),
    ],
  },
];

/** Flat list, every tool exactly once — what the search box filters over. */
export const allTools: Tool[] = toolCategories.flatMap((c) => c.tools);

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored worker copied from pdfjs-dist, not our source.
    "public/pdf.worker.min.mjs",
    // Isolated agent worktrees (created under .claude/worktrees/ for
    // background subagent tasks) are full repo checkouts, not our source.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;

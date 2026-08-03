import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import IncomeTaxCalculatorClient from "./IncomeTaxCalculatorClient";

const TITLE = "Income Tax Calculator — CTC, Salary & Old vs. New Regime (India) — PDF Genie";
const DESCRIPTION =
  "Build your CTC structure and compare the old and new income-tax regimes for AY 2026-27 — HRA exemption, deductions, monthly TDS, and real take-home pay. Runs entirely in your browser.";
const PATH = "/tools/income-tax-calculator";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, siteName: "PDF Genie", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return <IncomeTaxCalculatorClient />;
}

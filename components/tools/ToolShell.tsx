import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ToolShellProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
};

export function ToolShell({ icon: Icon, title, description, children }: ToolShellProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${title} — PDF Genie`,
    description,
    applicationCategory: "Utility",
    operatingSystem: "Any (Web-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl">
        <Link
          href="/tools"
          data-hover="true"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-brown-dark/70 transition-colors hover:text-brand-blue-deep"
        >
          <ArrowLeft size={16} />
          All tools
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="tool-shell-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
            <Icon size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-brand-brown-dark/65">{description}</p>
          </div>
        </div>

        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

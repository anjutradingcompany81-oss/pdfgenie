import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 pb-20 pt-32 text-center lg:px-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
        <FileQuestion size={30} />
      </div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-brand-brown-dark/70">
        The page you&apos;re looking for doesn&apos;t exist, or the link may be out of date. Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <MagneticButton href="/tools">Browse all tools</MagneticButton>
        <Link href="/" data-hover="true" className="text-sm font-semibold text-brand-brown-dark/70 hover:text-brand-blue-deep">
          Back to home
        </Link>
      </div>
    </div>
  );
}

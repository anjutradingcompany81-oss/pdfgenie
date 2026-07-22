import { ShieldCheck } from "lucide-react";

export function PrivacyNote() {
  return (
    <p className="mt-6 flex items-center gap-2 text-xs text-brand-brown-dark/45">
      <ShieldCheck size={14} className="shrink-0" />
      Everything happens in your browser — your files are never uploaded anywhere.
    </p>
  );
}

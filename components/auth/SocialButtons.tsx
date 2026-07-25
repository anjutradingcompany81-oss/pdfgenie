"use client";

import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.74l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.63l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

const PROVIDERS = [{ id: "google", label: "Continue with Google", Icon: GoogleIcon }] as const;

export function SocialButtons({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          data-hover="true"
          onClick={() => signIn(id, { callbackUrl: callbackUrl || "/dashboard" })}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm font-semibold text-brand-brown-dark transition-colors hover:border-brand-blue/40 hover:bg-brand-cream"
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}

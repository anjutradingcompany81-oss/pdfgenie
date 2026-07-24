"use client";

import type { ReactNode } from "react";

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-hover="true"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/70 hover:text-brand-brown-dark"
      }`}
    >
      {children}
    </button>
  );
}

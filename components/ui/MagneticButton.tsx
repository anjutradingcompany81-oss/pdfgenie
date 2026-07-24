"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { useRef } from "react";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "solid" | "outline" | "inverted";
  type?: "button" | "submit";
  disabled?: boolean;
};

export function MagneticButton({
  children,
  href,
  onClick,
  className = "",
  variant = "solid",
  type = "button",
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.3 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (reduceMotion || disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * 0.35);
    y.set(relY * 0.45);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold tracking-wide transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue-light";
  const solid =
    "bg-gradient-to-r from-brand-blue-deep to-brand-blue text-white shadow-[0_0_0_0_rgba(143,179,255,0)] hover:brightness-110 hover:shadow-[0_0_30px_-6px_var(--color-brand-blue-light)]";
  const outline =
    "border-2 border-brand-brown/60 text-foreground hover:border-brand-brown hover:bg-brand-brown/10";
  const inverted = "bg-brand-gold-glow text-[#12131f] hover:brightness-105";

  const variantClass =
    variant === "solid" ? solid : variant === "outline" ? outline : inverted;

  const content = (
    <motion.div
      ref={ref}
      data-hover={disabled ? undefined : "true"}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`${base} ${variantClass} ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href && !disabled) {
    if (href.startsWith("#")) {
      return (
        <a href={href} className="inline-block" onClick={onClick}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="inline-block" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block">
      {content}
    </button>
  );
}

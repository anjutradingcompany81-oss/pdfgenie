"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), reduceMotion ? 0 : 1600);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  if (reduceMotion) return null;

  const word = "PDF Genie";

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-cream"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut", delay: 0.1 }}
        >
          <motion.div
            className="absolute inset-0 origin-bottom bg-brand-blue/20"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: 0.8 }}
          />
          <div className="relative flex overflow-hidden">
            {word.split("").map((char, i) => (
              <motion.span
                key={i}
                className="text-3xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl"
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.035,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {char === " " ? " " : char}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

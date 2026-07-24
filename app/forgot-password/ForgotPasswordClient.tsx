"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function ForgotPasswordPageClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 py-32">
      <div className="w-full max-w-sm rounded-3xl border border-brand-brown-dark/10 bg-brand-surface p-8">
        <h1 className="text-2xl font-bold text-brand-brown-dark">Reset your password</h1>
        <p className="mt-2 text-sm text-brand-brown-dark/65">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {done ? (
          <p className="mt-6 text-sm font-medium text-brand-blue-deep">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
            </div>

            {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

            <MagneticButton type="submit" disabled={loading} className="w-full justify-center">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </MagneticButton>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-brand-brown-dark/65">
          <Link href="/login" data-hover="true" className="font-semibold text-brand-blue-deep hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState, type FormEvent } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 py-32">
      <div className="w-full max-w-sm rounded-3xl border border-white/8 bg-brand-surface p-8">
        <h1 className="text-2xl font-bold text-brand-brown-dark">Set a new password</h1>

        {done ? (
          <p className="mt-6 text-sm font-medium text-brand-blue-deep">
            Password updated. Redirecting you to log in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 pr-12 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown-dark/40 hover:text-brand-brown-dark"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
              />
            </div>

            {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

            <MagneticButton type="submit" disabled={loading} className="w-full justify-center">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating…
                </>
              ) : (
                "Update password"
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

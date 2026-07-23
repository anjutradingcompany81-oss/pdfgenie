"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SocialButtons } from "@/components/auth/SocialButtons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        remember: remember ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        setError("That email and password don't match an account.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 py-32">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-brand-brown-dark/10 bg-white p-8">
          <h1 className="text-2xl font-bold text-brand-brown-dark">Welcome back</h1>
          <p className="mt-2 text-sm text-brand-brown-dark/65">
            Log in to access your dashboard.
          </p>

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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-brand-brown-dark">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  data-hover="true"
                  className="text-xs font-semibold text-brand-blue-deep hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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

            <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
              />
              Remember me
            </label>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <MagneticButton type="submit" disabled={loading} className="w-full justify-center">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Log in"
              )}
            </MagneticButton>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-brown-dark/40">
            <span className="h-px flex-1 bg-brand-brown-dark/10" />
            or continue with
            <span className="h-px flex-1 bg-brand-brown-dark/10" />
          </div>

          <SocialButtons callbackUrl={callbackUrl} />
        </div>

        <p className="mt-6 text-center text-sm text-brand-brown-dark/65">
          Don&apos;t have an account?{" "}
          <Link href="/signup" data-hover="true" className="font-semibold text-brand-blue-deep hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

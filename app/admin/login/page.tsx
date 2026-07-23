"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 py-32">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-brand-brown-dark/10 bg-white p-8"
      >
        <h1 className="text-2xl font-bold text-brand-brown-dark">Admin login</h1>
        <p className="mt-2 text-sm text-brand-brown-dark/65">
          Sign in to manage the live website.
        </p>

        <label className="mt-6 block text-sm font-semibold text-brand-brown-dark">
          Username
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-brand-brown-dark/15 px-4 py-2.5 text-base text-brand-brown-dark outline-none focus:border-brand-blue"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-brand-brown-dark">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-brand-brown-dark/15 px-4 py-2.5 text-base text-brand-brown-dark outline-none focus:border-brand-blue"
          />
        </label>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand-blue-deep py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

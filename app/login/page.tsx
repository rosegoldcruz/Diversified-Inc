"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <LoginShell>
          <LoginCardSkeleton />
        </LoginShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `Login failed (${response.status})`);
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginShell>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-white/15 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-white">Diversified OS</h1>
          <p className="text-sm text-slate-300">Sign in to continue.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </LoginShell>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10">
      {children}
    </main>
  );
}

function LoginCardSkeleton() {
  return (
    <div className="h-96 w-full max-w-md animate-pulse rounded-2xl border border-white/10 bg-slate-900/60" />
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : null;
  const next =
    typeof searchParams?.next === "string" &&
    searchParams.next.startsWith("/") &&
    !searchParams.next.startsWith("//")
      ? searchParams.next
      : "/dashboard";

  if (!error) {
    redirect(`/api/auth/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <LoginShell>
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/15 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-white">Diversified OS</h1>
          <p className="text-sm text-slate-300">
            Sign-in is handled by Zitadel.
          </p>
        </div>

        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>

        <Link
          href={`/api/auth/login?next=${encodeURIComponent(next)}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Try sign-in again
        </Link>
      </div>
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

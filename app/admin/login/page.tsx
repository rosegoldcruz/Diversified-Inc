import { AdminLoginForm } from "./ui";
import { requireAdminOrRedirectToLoginGate } from "@/app/admin/_lib/admin-guard";

export default async function AdminLoginPage() {
  const access = requireAdminOrRedirectToLoginGate();

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-white/20 bg-black/30 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-textPrimary">Admin Login</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Re-authenticate to access protected admin controls.
        </p>
      </div>

      {access.session?.provider && access.session.provider !== "local" ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          Admin re-authentication for this auth provider is not configured yet.
          <a
            href="/api/auth/login?next=/admin"
            className="mt-2 block w-full rounded bg-blue-600 py-2 text-center text-white hover:bg-blue-700"
          >
            Re-authenticate with {access.session.provider}
          </a>
        </div>
      ) : (
        <AdminLoginForm />
      )}
    </div>
  );
}

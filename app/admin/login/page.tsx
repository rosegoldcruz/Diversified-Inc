import { AdminLoginForm } from "./ui";
import { requireAdminOrRedirectToLoginGate } from "@/app/admin/_lib/admin-guard";
import { randomBytes } from "crypto";
import {
  OIDC_STATE_COOKIE,
  OIDC_COOKIE_OPTIONS,
  getOidcDiscovery,
  getRedirectUri,
} from "@/lib/oidc";
import { requireEnv } from "@/lib/env";

export default async function AdminLoginPage() {
  const access = requireAdminOrRedirectToLoginGate();

  const handleOidcLogin = async () => {
    const discovery = await getOidcDiscovery();
    const redirectUri = getRedirectUri();
    const state = randomBytes(16).toString("hex");

    document.cookie = `${OIDC_STATE_COOKIE}=${state}; ${OIDC_COOKIE_OPTIONS}`;
    window.location.href = `${discovery.authorization_endpoint}?response_type=code&client_id=${requireEnv("ZITADEL_CLIENT_ID")}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=openid email profile&state=${state}`;
  };

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
          <button
            onClick={handleOidcLogin}
            className="mt-2 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
          >
            Re-authenticate with {access.session.provider}
          </button>
        </div>
      ) : (
        <AdminLoginForm />
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import { getAdminPortalAccess } from "@/lib/admin-portal-session";

export function requireAdminPortal() {
  const access = getAdminPortalAccess();

  if (!access.session) {
    redirect("/login?next=/admin");
  }

  if (access.reason === "ROLE_FORBIDDEN") {
    redirect("/settings?error=admin-role-required");
  }

  if (!access.allowed) {
    redirect("/admin/login");
  }

  return access;
}

export function requireAdminOrRedirectToLoginGate() {
  const access = getAdminPortalAccess();

  if (!access.session) {
    redirect("/login?next=/admin/login");
  }

  if (access.reason === "ROLE_FORBIDDEN") {
    redirect("/settings?error=admin-role-required");
  }

  if (access.allowed) {
    redirect("/admin");
  }

  return access;
}

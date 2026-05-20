import { requireAdminPortal } from "@/app/admin/_lib/admin-guard";
import { AdminIntegrationsClient } from "./ui";

export default function AdminIntegrationsPage() {
  requireAdminPortal();
  return <AdminIntegrationsClient />;
}

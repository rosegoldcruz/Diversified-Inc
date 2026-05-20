import { requireAdminPortal } from "@/app/admin/_lib/admin-guard";
import { AdminAuditClient } from "./ui";

export default function AdminAuditPage() {
  requireAdminPortal();
  return <AdminAuditClient />;
}

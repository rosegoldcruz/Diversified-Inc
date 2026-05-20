import { requireAdminPortal } from "@/app/admin/_lib/admin-guard";
import { AdminUsersClient } from "./ui";

export default function AdminUsersPage() {
  requireAdminPortal();
  return <AdminUsersClient />;
}

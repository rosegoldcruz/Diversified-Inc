import { requireAdminPortal } from "@/app/admin/_lib/admin-guard";
import { AdminSystemClient } from "./ui";

export default function AdminSystemPage() {
  requireAdminPortal();
  return <AdminSystemClient />;
}

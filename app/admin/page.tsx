import Link from "next/link";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { requireAdminPortal } from "@/app/admin/_lib/admin-guard";

const CARDS = [
  {
    href: "/admin/users",
    title: "Users",
    description: "Employee accounts, role visibility, and active status.",
  },
  {
    href: "/admin/system",
    title: "System",
    description: "Database and environment readiness for operations modules.",
  },
  {
    href: "/admin/integrations",
    title: "Integrations",
    description: "PostgreSQL, NocoDB, n8n, AI provider, and Microsoft status.",
  },
  {
    href: "/admin/audit",
    title: "Audit",
    description: "Recent admin and settings actions from audit logs.",
  },
];

export default function AdminDashboardPage() {
  requireAdminPortal();

  return (
    <AdminLayout>
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="glass-surface glass-surface-hover rounded-2xl p-5"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-textSecondary">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}

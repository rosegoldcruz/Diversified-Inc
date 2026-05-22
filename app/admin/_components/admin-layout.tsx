"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/system", label: "System" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/audit", label: "Audit" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pushToast } = useToast();

  async function endAdminSession() {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to end admin session.");
      }
      pushToast("Admin session ended.", "success");
      router.push("/settings");
      router.refresh();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to end admin session.",
        "error",
      );
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-semibold text-textPrimary">
          Admin Portal
        </h1>
        <p className="mt-1 text-sm text-textSecondary">
          Protected operational controls for Diversified OS administrators.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-xl border px-3 py-2 text-sm transition",
              pathname === item.href
                ? "border-accent/60 bg-accent/20 text-textPrimary"
                : "border-white/20 bg-white/10 text-textSecondary hover:bg-white/20",
            ].join(" ")}
          >
            {item.label}
          </Link>
        ))}
        <div className="ml-auto">
          <Button variant="outline" onClick={() => void endAdminSession()}>
            Exit admin portal
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}

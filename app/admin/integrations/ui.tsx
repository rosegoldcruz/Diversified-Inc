"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/toast";

type Integration = {
  key: string;
  name: string;
  status: string;
  configured: boolean;
  details: string;
  adminUrl: string | null;
};

type IntegrationResponse = {
  checkedAt: string;
  integrations: Integration[];
};

export function AdminIntegrationsClient() {
  const { pushToast } = useToast();
  const [data, setData] = useState<IntegrationResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/integrations", {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to load integrations.");
      }
      setData((await response.json()) as IntegrationResponse);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to load integrations.",
        "error",
      );
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) {
    return (
      <AdminLayout>
        <p className="text-sm text-textSecondary">Loading integrations...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">Integrations</h2>
        <p className="mt-1 text-sm text-textSecondary">
          Status is derived from live environment/database checks. Secrets are
          never displayed.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.integrations.map((integration) => (
            <div
              key={integration.key}
              className="rounded-xl border border-white/15 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-textPrimary">
                  {integration.name}
                </h3>
                <Badge
                  variant={
                    integration.status === "healthy" ||
                    integration.status === "configured"
                      ? "success"
                      : integration.status === "missing"
                        ? "warning"
                        : integration.status === "error"
                          ? "danger"
                          : "default"
                  }
                >
                  {integration.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-textMuted">
                {integration.details}
              </p>
              {integration.adminUrl ? (
                <a
                  href={integration.adminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-xs font-medium text-accent"
                >
                  Open admin URL
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}

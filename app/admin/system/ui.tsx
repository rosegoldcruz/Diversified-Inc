"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/toast";

type SystemResponse = {
  checkedAt: string;
  database: { status: "healthy" | "error"; error: string | null };
  environment: {
    checks: Array<{ key: string; configured: boolean }>;
    configured: number;
    total: number;
  };
  modules: Array<{ key: string; route: string }>;
  securityReadiness: Record<string, string>;
  backupReadiness: { status: string; notes: string };
  runtime: { nodeEnv: string; deploymentTarget: string };
};

export function AdminSystemClient() {
  const { pushToast } = useToast();
  const [data, setData] = useState<SystemResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/system", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to load system status.");
      }
      const payload = (await response.json()) as SystemResponse;
      setData(payload);
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Failed to load system status.",
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
        <p className="text-sm text-textSecondary">Loading system status...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          System Readiness
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant={data.database.status === "healthy" ? "success" : "danger"}
          >
            Database: {data.database.status}
          </Badge>
          <span className="text-xs text-textMuted">
            Checked: {new Date(data.checkedAt).toLocaleString()}
          </span>
        </div>
        {data.database.error ? (
          <p className="mt-2 text-sm text-red-300">{data.database.error}</p>
        ) : null}
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">Environment</h2>
        <p className="mt-1 text-sm text-textSecondary">
          {data.environment.configured} of {data.environment.total} required
          groups configured.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {data.environment.checks.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-white/15 px-3 py-2"
            >
              <span>{item.key}</span>
              <Badge variant={item.configured ? "success" : "warning"}>
                {item.configured ? "Configured" : "Missing"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Modules and Security
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/15 p-4">
            <p className="text-sm font-medium text-textPrimary">
              Module visibility
            </p>
            <p className="mt-1 text-xs text-textMuted">
              {data.modules.length} internal routes currently tracked.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 p-4">
            <p className="text-sm font-medium text-textPrimary">
              Security readiness
            </p>
            <ul className="mt-2 space-y-1 text-xs text-textMuted">
              {Object.entries(data.securityReadiness).map(([key, value]) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Backup and Runtime Notes
        </h2>
        <p className="mt-2 text-sm text-textSecondary">
          {data.backupReadiness.notes}
        </p>
        <p className="mt-2 text-xs text-textMuted">
          Runtime: {data.runtime.nodeEnv} / {data.runtime.deploymentTarget}
        </p>
      </section>
    </AdminLayout>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { useToast } from "@/components/ui/toast";

type AuditLog = {
  id: string;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id_text: string | null;
  created_at: string;
};

type AuditResponse = {
  configured: boolean;
  logs: AuditLog[];
  error?: string;
};

export function AdminAuditClient() {
  const { pushToast } = useToast();
  const [data, setData] = useState<AuditResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/audit?limit=50", {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to load audit logs.");
      }
      setData((await response.json()) as AuditResponse);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to load audit logs.",
        "error",
      );
    }
  }, [pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">Audit Logs</h2>
        {!data ? (
          <p className="mt-2 text-sm text-textSecondary">Loading...</p>
        ) : null}

        {data && !data.configured ? (
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
            Audit logging not configured.{" "}
            {data.error || "No audit table available."}
          </div>
        ) : null}

        {data && data.configured ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left">
                  <th className="px-2 py-2 text-textMuted">Timestamp</th>
                  <th className="px-2 py-2 text-textMuted">Module</th>
                  <th className="px-2 py-2 text-textMuted">Action</th>
                  <th className="px-2 py-2 text-textMuted">Entity</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/10">
                    <td className="px-2 py-3 text-textSecondary">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-textSecondary">
                      {log.module}
                    </td>
                    <td className="px-2 py-3 text-textPrimary">{log.action}</td>
                    <td className="px-2 py-3 text-textSecondary">
                      {log.entity_type || "-"}
                      {log.entity_id_text ? ` (${log.entity_id_text})` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </AdminLayout>
  );
}

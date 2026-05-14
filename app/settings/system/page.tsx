"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { ShinyText } from "@/components/ui/ShinyText";
import {
  CLIENT_VISIBLE_MODULES,
  SETTING_KEYS,
  type AutomationMode,
  type ClientVisibleModulesMap,
  type ModuleVisibility,
} from "@/lib/settings-config";

type HealthResponse = {
  status: "healthy" | "degraded" | "error";
  checkedAt: string;
  database: {
    status: "healthy" | "degraded" | "error";
    hostLabel: string;
    environment: string;
    latencyMs: number | null;
    expectedTables: Array<{ name: string; exists: boolean }>;
  };
  n8n: {
    baseUrl: string;
    webhookSecretConfigured: boolean;
    automationMode: AutomationMode;
    categories: Record<string, boolean>;
    checkedAt: string;
  };
  security: {
    authEnabled: boolean;
    roleBasedAccessEnabled: boolean;
    apiRouteProtectionStatus: string;
    inputValidationStatus: string;
    auditLoggingStatus: string;
    notes: string[];
  };
  runtime: {
    appVersion: string;
    nodeEnv: string;
    deploymentTarget: string;
    productionUrl: string;
    stagingUrl: string;
    buildStatus: string;
    notes: string[];
  };
};

type EnvResponse = {
  checkedAt: string;
  groups: Array<{
    group: string;
    items: Array<{
      key: string;
      configured: boolean;
      required: boolean;
      purpose: string;
    }>;
  }>;
  totals: {
    required: number;
    requiredConfigured: number;
    optional: number;
    optionalConfigured: number;
  };
};

type IntegrationsResponse = {
  checkedAt: string;
  integrations: Array<{
    key: string;
    name: string;
    status:
      | "Healthy"
      | "Configured"
      | "Missing"
      | "Partial"
      | "Not Configured"
      | "Error";
    configured: boolean;
    purpose: string;
    lastChecked: string;
    notes: string;
    clientProductionVisibility: "visible" | "internal";
  }>;
};

type AuditResponse = {
  logs: Array<{
    id: number;
    action: string;
    module: string;
    record_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  count: number;
};

type SettingsResponse = {
  byKey: {
    automation_mode?: AutomationMode;
    client_visible_modules?: ClientVisibleModulesMap;
  };
};

function toReadableDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (
    normalized === "healthy" ||
    normalized === "configured" ||
    normalized === "connected"
  )
    return "success" as const;
  if (normalized === "partial" || normalized === "degraded")
    return "warning" as const;
  if (normalized === "missing" || normalized === "error")
    return "danger" as const;
  return "default" as const;
}

export default function SystemSettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [envStatus, setEnvStatus] = useState<EnvResponse | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(
    null,
  );
  const [auditLogs, setAuditLogs] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [automationMode, setAutomationMode] =
    useState<AutomationMode>("disabled");
  const [moduleVisibility, setModuleVisibility] =
    useState<ClientVisibleModulesMap | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [n8nTestResult, setN8nTestResult] = useState<string | null>(null);

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError(null);

      const [healthRes, envRes, integrationsRes, auditRes, settingsRes] =
        await Promise.all([
          fetch("/api/settings/system-health", { cache: "no-store" }),
          fetch("/api/settings/env-status", { cache: "no-store" }),
          fetch("/api/settings/integrations", { cache: "no-store" }),
          fetch("/api/settings/audit-logs?limit=10", { cache: "no-store" }),
          fetch("/api/settings", { cache: "no-store" }),
        ]);

      if (
        !healthRes.ok ||
        !envRes.ok ||
        !integrationsRes.ok ||
        !auditRes.ok ||
        !settingsRes.ok
      ) {
        throw new Error("One or more system settings endpoints failed.");
      }

      const healthJson = (await healthRes.json()) as HealthResponse;
      const envJson = (await envRes.json()) as EnvResponse;
      const integrationsJson =
        (await integrationsRes.json()) as IntegrationsResponse;
      const auditJson = (await auditRes.json()) as AuditResponse;
      const settingsJson = (await settingsRes.json()) as SettingsResponse;

      setHealth(healthJson);
      setEnvStatus(envJson);
      setIntegrations(integrationsJson);
      setAuditLogs(auditJson);
      setAutomationMode(settingsJson.byKey.automation_mode ?? "disabled");
      setModuleVisibility(settingsJson.byKey.client_visible_modules ?? null);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load system settings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function patchSetting(key: string, value: unknown) {
    setSavingKey(key);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${key}`);
      }

      await loadAll();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to persist setting";
      setError(message);
    } finally {
      setSavingKey(null);
    }
  }

  async function testN8nConnection() {
    setN8nTestResult("Testing...");
    try {
      const response = await fetch("/api/settings/test-n8n", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        setN8nTestResult(payload?.message || payload?.error || "Test failed");
        return;
      }

      setN8nTestResult(
        `${payload.status} (${payload.httpStatus}) at ${toReadableDate(payload.checkedAt)}`,
      );
      await loadAll();
    } catch {
      setN8nTestResult("Connection test failed");
    }
  }

  const tableHealth = useMemo(() => {
    const tables = health?.database.expectedTables ?? [];
    return {
      total: tables.length,
      missing: tables.filter((table) => !table.exists).length,
    };
  }, [health]);

  if (loading) {
    return (
      <p className="p-6 text-sm text-textSecondary">
        Loading system control center...
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <Badge variant="danger">Error</Badge>
        <p className="text-sm text-textSecondary">{error}</p>
        <Button variant="outline" onClick={() => void loadAll()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!health || !envStatus || !integrations || !auditLogs) {
    return (
      <p className="p-6 text-sm text-textSecondary">
        System data is unavailable.
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-textPrimary">
          <ShinyText>System Settings</ShinyText>
        </h1>
        <p className="text-sm text-textSecondary">
          Truthful backend readiness for Diversified OS. Writable controls are
          limited to safe, persisted configuration only.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-surface rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-textMuted">
            Database
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={statusBadge(health.database.status)}>
              {health.database.status}
            </Badge>
            <span className="text-sm text-textSecondary">
              {health.database.hostLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-textMuted">
            Latency: {health.database.latencyMs ?? "N/A"} ms
          </p>
          <p className="text-xs text-textMuted">
            Last check: {toReadableDate(health.checkedAt)}
          </p>
        </article>

        <article className="glass-surface rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-textMuted">
            Environment
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="blue">{health.database.environment}</Badge>
            <span className="text-sm text-textSecondary">
              Required vars: {envStatus.totals.requiredConfigured}/
              {envStatus.totals.required}
            </span>
          </div>
          <p className="mt-2 text-xs text-textMuted">
            Optional vars: {envStatus.totals.optionalConfigured}/
            {envStatus.totals.optional}
          </p>
        </article>

        <article className="glass-surface rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-textMuted">
            Automation Mode
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={statusBadge(automationMode)}>
              {automationMode}
            </Badge>
            <span className="text-sm text-textSecondary">
              n8n readiness only
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <select
              className="h-9 rounded-xl border border-white/30 bg-white/60 px-3 text-sm text-textPrimary dark:border-white/10 dark:bg-white/5"
              value={automationMode}
              onChange={(event) =>
                setAutomationMode(event.target.value as AutomationMode)
              }
            >
              <option value="disabled">Disabled</option>
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
            <Button
              size="sm"
              onClick={() =>
                void patchSetting(SETTING_KEYS.automationMode, automationMode)
              }
              disabled={savingKey === SETTING_KEYS.automationMode}
            >
              Save
            </Button>
          </div>
        </article>
      </section>

      <section id="database" className="glass-surface rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-textPrimary">
            Database Status
          </h2>
          <Badge variant={statusBadge(health.database.status)}>
            {health.database.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-textSecondary">
          PostgreSQL host label: {health.database.hostLabel}. Expected table
          coverage: {tableHealth.total - tableHealth.missing}/
          {tableHealth.total}.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {health.database.expectedTables.map((table) => (
            <div
              key={table.name}
              className="rounded-xl border border-white/20 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-textPrimary">{table.name}</span>
                <Badge variant={table.exists ? "success" : "warning"}>
                  {table.exists ? "Configured" : "Missing"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="integrations" className="glass-surface rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-textPrimary">
            n8n Automation Status
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void testN8nConnection()}
          >
            Test Connection
          </Button>
        </div>
        <p className="mt-2 text-sm text-textSecondary">
          Base URL: {health.n8n.baseUrl}. Webhook secret configured:{" "}
          {health.n8n.webhookSecretConfigured ? "Yes" : "No"}.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(health.n8n.categories).map(([key, configured]) => (
            <div
              key={key}
              className="rounded-xl border border-white/20 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-textPrimary">
                  {key.replaceAll("_", " ")}
                </span>
                <Badge variant={configured ? "success" : "default"}>
                  {configured ? "Configured" : "Missing"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {n8nTestResult ? (
          <p className="mt-3 text-xs text-textMuted">{n8nTestResult}</p>
        ) : null}
      </section>

      <section id="environment" className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Environment Variables Status
        </h2>
        <p className="mt-2 text-sm text-textSecondary">
          Values are never shown. This checklist only reports configured or
          missing.
        </p>
        <div className="mt-4 space-y-4">
          {envStatus.groups.map((group) => (
            <div
              key={group.group}
              className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5"
            >
              <h3 className="text-sm font-semibold text-textPrimary">
                {group.group}
              </h3>
              <div className="mt-2 space-y-2">
                {group.items.map((item) => (
                  <div
                    key={`${group.group}-${item.key}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <p className="text-textPrimary">{item.key}</p>
                      <p className="text-xs text-textMuted">{item.purpose}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.required ? "warning" : "neutral"}>
                        {item.required ? "Required" : "Optional"}
                      </Badge>
                      <Badge variant={item.configured ? "success" : "danger"}>
                        {item.configured ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="security" className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Security Status
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Auth Enabled</p>
            <Badge
              variant={health.security.authEnabled ? "success" : "warning"}
            >
              {health.security.authEnabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">RBAC Enabled</p>
            <Badge
              variant={
                health.security.roleBasedAccessEnabled ? "success" : "warning"
              }
            >
              {health.security.roleBasedAccessEnabled ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">API Route Protection</p>
            <Badge
              variant={statusBadge(health.security.apiRouteProtectionStatus)}
            >
              {health.security.apiRouteProtectionStatus}
            </Badge>
          </div>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-textSecondary">
          {health.security.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section id="audit-logs" className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Logging and Audit Status
        </h2>
        {auditLogs.count === 0 ? (
          <p className="mt-2 text-sm text-textSecondary">
            No events logged yet. The system audit table is ready and will
            populate as settings and write actions are tracked.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left text-textMuted dark:border-white/10">
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Action</th>
                  <th className="px-2 py-2 font-medium">Module</th>
                  <th className="px-2 py-2 font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/10 align-top"
                  >
                    <td className="px-2 py-2 text-textSecondary">
                      {toReadableDate(log.created_at)}
                    </td>
                    <td className="px-2 py-2 text-textPrimary">{log.action}</td>
                    <td className="px-2 py-2 text-textSecondary">
                      {log.module}
                    </td>
                    <td className="px-2 py-2 text-textMuted">
                      {log.record_id ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="backups" className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Backup / Data Export Strategy
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Database Backup Status</p>
            <Badge variant="warning">Manual / Unknown</Badge>
            <p className="mt-2 text-xs text-textSecondary">
              No automated backup scheduler is currently reported by the app UI.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Last Backup Timestamp</p>
            <p className="mt-1 text-sm text-textPrimary">
              Not available from app runtime
            </p>
            <p className="mt-2 text-xs text-textSecondary">
              Track backups via server cron logs or external backup monitor.
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Recommended command: scripts/backup-postgres.sh. Keep backup
          credentials in env vars, never in UI forms.
        </div>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Deployment / Runtime Status
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">App Version</p>
            <p className="text-sm text-textPrimary">
              {health.runtime.appVersion}
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Node Environment</p>
            <p className="text-sm text-textPrimary">{health.runtime.nodeEnv}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Deployment Target</p>
            <p className="text-sm text-textPrimary">
              {health.runtime.deploymentTarget}
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Production URL</p>
            <p className="text-sm text-textPrimary break-words">
              {health.runtime.productionUrl}
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Staging URL</p>
            <p className="text-sm text-textPrimary break-words">
              {health.runtime.stagingUrl}
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs text-textMuted">Build Status</p>
            <Badge variant="default">{health.runtime.buildStatus}</Badge>
          </div>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-textSecondary">
          {health.runtime.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">Integrations</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {integrations.integrations.map((integration) => (
            <article
              key={integration.key}
              className="rounded-xl border border-white/20 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-textPrimary">
                  {integration.name}
                </h3>
                <Badge variant={statusBadge(integration.status)}>
                  {integration.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-textSecondary">
                {integration.purpose}
              </p>
              <p className="mt-2 text-xs text-textMuted">{integration.notes}</p>
              <p className="mt-1 text-xs text-textMuted">
                Production visibility:{" "}
                {integration.clientProductionVisibility === "visible"
                  ? "Visible"
                  : "Internal-only"}
              </p>
              <p className="mt-1 text-[11px] text-textMuted">
                Last checked: {toReadableDate(integration.lastChecked)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-textPrimary">
          Module Visibility
        </h2>
        <p className="mt-2 text-sm text-textSecondary">
          Persisted feature visibility controls for production navigation. This
          saves to system_settings as client_visible_modules.
        </p>
        {!moduleVisibility ? (
          <p className="mt-3 text-sm text-textMuted">
            Visibility settings unavailable.
          </p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CLIENT_VISIBLE_MODULES.map((moduleName) => (
              <div
                key={moduleName}
                className="rounded-xl border border-white/20 bg-white/40 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <label className="mb-2 block text-sm font-medium text-textPrimary">
                  {moduleName}
                </label>
                <select
                  value={moduleVisibility[moduleName]}
                  className="h-9 w-full rounded-xl border border-white/30 bg-white/70 px-3 text-sm text-textPrimary dark:border-white/10 dark:bg-white/5"
                  onChange={(event) => {
                    const nextVisibility = event.target
                      .value as ModuleVisibility;
                    setModuleVisibility((current) => {
                      if (!current) return current;
                      return {
                        ...current,
                        [moduleName]: nextVisibility,
                      };
                    });
                  }}
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="internal">Internal Only</option>
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Button
            onClick={() =>
              moduleVisibility
                ? patchSetting(
                    SETTING_KEYS.clientVisibleModules,
                    moduleVisibility,
                  )
                : Promise.resolve()
            }
            disabled={
              !moduleVisibility ||
              savingKey === SETTING_KEYS.clientVisibleModules
            }
          >
            Save Visibility Controls
          </Button>
        </div>
      </section>
    </div>
  );
}

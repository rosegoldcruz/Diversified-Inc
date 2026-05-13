import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { query } from "@/lib/db";
import { getAllSettings } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

const EXPECTED_TABLES = [
  "employees",
  "tasks",
  "requests",
  "work_orders",
  "inventory",
  "sops",
  "file_records",
  "timeclock_entries",
  "timesheets",
  "system_settings",
  "system_audit_logs",
];

function getDatabaseHostLabel() {
  const url = process.env.DATABASE_URL;
  if (!url) return "Missing DATABASE_URL";

  try {
    const parsed = new URL(url);
    return parsed.hostname || "Unknown host";
  } catch {
    return "Unable to parse database host";
  }
}

async function getAppVersion() {
  try {
    const raw = await readFile(`${process.cwd()}/package.json`, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function getDeploymentTarget() {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "staging";
  if (process.env.NODE_ENV === "production") return "production";
  return "local";
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    const startedAt = Date.now();
    await query("SELECT 1 AS ok");
    const latencyMs = Date.now() - startedAt;

    const tableRows = await query<{ table_name: string }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `,
      [EXPECTED_TABLES],
    );

    const foundTables = new Set(tableRows.map((row) => row.table_name));
    const expectedTables = EXPECTED_TABLES.map((name) => ({
      name,
      exists: foundTables.has(name),
    }));

    const missingCount = expectedTables.filter((item) => !item.exists).length;
    const status = missingCount > 0 ? "degraded" : "healthy";

    const settings = await getAllSettings();
    const automationMode = settings.byKey.automation_mode;

    const appVersion = await getAppVersion();
    const runtime = {
      appVersion,
      nodeEnv: process.env.NODE_ENV ?? "development",
      deploymentTarget: getDeploymentTarget(),
      productionUrl:
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        "Not configured",
      stagingUrl: process.env.NEXT_PUBLIC_STAGING_URL || "Not configured",
      buildStatus: "unknown",
      notes: [
        "PM2 and nginx are managed at the server level and are read-only from this UI.",
      ],
    };

    const security = {
      authEnabled: false,
      roleBasedAccessEnabled: false,
      apiRouteProtectionStatus: "partial",
      inputValidationStatus: "partial",
      auditLoggingStatus: foundTables.has("system_audit_logs")
        ? "configured"
        : "missing",
      notes: [
        "Auth/session and RBAC enforcement are not fully implemented yet.",
        "This page reports readiness without claiming full compliance coverage.",
      ],
    };

    const n8n = {
      baseUrl: process.env.N8N_BASE_URL || "Not configured",
      webhookSecretConfigured: Boolean(process.env.N8N_WEBHOOK_SECRET),
      automationMode:
        automationMode === "disabled" ||
        automationMode === "test" ||
        automationMode === "live"
          ? automationMode
          : "disabled",
      categories: {
        form_submitted: Boolean(process.env.N8N_FORM_SUBMITTED_WEBHOOK),
        request_created: Boolean(process.env.N8N_REQUEST_CREATED_WEBHOOK),
        task_assigned: Boolean(process.env.N8N_TASK_ASSIGNED_WEBHOOK),
        task_overdue: Boolean(process.env.N8N_TASK_OVERDUE_WEBHOOK),
        low_inventory: Boolean(process.env.N8N_LOW_INVENTORY_WEBHOOK),
        weekly_summary: Boolean(process.env.N8N_WEEKLY_SUMMARY_WEBHOOK),
      },
      checkedAt,
    };

    return NextResponse.json({
      status,
      checkedAt,
      database: {
        status,
        hostLabel: getDatabaseHostLabel(),
        environment: process.env.NODE_ENV ?? "development",
        latencyMs,
        expectedTables,
      },
      n8n,
      security,
      runtime,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to check system health";

    return NextResponse.json(
      {
        status: "error",
        checkedAt,
        database: {
          status: "error",
          hostLabel: getDatabaseHostLabel(),
          environment: process.env.NODE_ENV ?? "development",
          latencyMs: null,
          expectedTables: EXPECTED_TABLES.map((name) => ({
            name,
            exists: false,
          })),
        },
        error: message,
      },
      { status: 500 },
    );
  }
}

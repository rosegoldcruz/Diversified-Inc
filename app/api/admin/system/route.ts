import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminPortalAccess } from "@/lib/admin-portal-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODULES = [
  { key: "dashboard", route: "/dashboard" },
  { key: "tasks", route: "/tasks" },
  { key: "calendar", route: "/calendar" },
  { key: "forms", route: "/forms" },
  { key: "requests", route: "/requests" },
  { key: "work_orders", route: "/work-orders" },
  { key: "employees", route: "/employees" },
  { key: "inventory", route: "/inventory" },
  { key: "reports", route: "/reports" },
  { key: "files", route: "/files" },
  { key: "sops", route: "/sops" },
] as const;

function checkAccess() {
  const access = getAdminPortalAccess();
  if (!access.session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }
  if (!access.allowed) {
    return NextResponse.json(
      {
        error:
          access.reason === "ROLE_FORBIDDEN"
            ? "Admin role required"
            : "Admin re-authentication required",
      },
      { status: access.reason === "ROLE_FORBIDDEN" ? 403 : 401 },
    );
  }
  return null;
}

export async function GET() {
  const denied = checkAccess();
  if (denied) return denied;

  const checkedAt = new Date().toISOString();

  let databaseStatus: "healthy" | "error" = "error";
  let databaseError: string | null = null;
  try {
    await query("SELECT 1");
    databaseStatus = "healthy";
  } catch (error) {
    databaseStatus = "error";
    databaseError =
      error instanceof Error ? error.message : "Connection failed";
  }

  const envChecks = [
    { key: "DATABASE_URL", configured: Boolean(process.env.DATABASE_URL) },
    { key: "SESSION_SECRET", configured: Boolean(process.env.SESSION_SECRET) },
    {
      key: "NEXT_PUBLIC_APP_URL",
      configured: Boolean(
        process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL,
      ),
    },
    { key: "N8N_BASE_URL", configured: Boolean(process.env.N8N_BASE_URL) },
    {
      key: "NOCODB_BASE_URL",
      configured: Boolean(process.env.NOCODB_BASE_URL),
    },
  ];

  const securityReadiness = {
    authSession: "configured",
    roleChecks: "configured",
    adminReauth: "configured",
    twoFactor: "planned",
  };

  return NextResponse.json({
    checkedAt,
    database: {
      status: databaseStatus,
      error: databaseError,
    },
    environment: {
      checks: envChecks,
      configured: envChecks.filter((item) => item.configured).length,
      total: envChecks.length,
    },
    modules: MODULES,
    securityReadiness,
    backupReadiness: {
      status: "partial",
      notes:
        "Backup and export workflows are infrastructure-managed and not fully surfaced in-app yet.",
    },
    runtime: {
      nodeEnv: process.env.NODE_ENV || "development",
      deploymentTarget: process.env.VERCEL_ENV || "self-hosted",
    },
  });
}

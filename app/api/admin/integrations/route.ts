import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminPortalAccess } from "@/lib/admin-portal-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function status(configured: boolean): "configured" | "missing" {
  return configured ? "configured" : "missing";
}

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

  let postgresHealthy = false;
  try {
    await query("SELECT 1");
    postgresHealthy = true;
  } catch {
    postgresHealthy = false;
  }

  const integrations = [
    {
      key: "postgresql",
      name: "PostgreSQL",
      status: postgresHealthy ? "healthy" : "error",
      configured: Boolean(process.env.DATABASE_URL),
      details: postgresHealthy
        ? "Connection check succeeded."
        : "Connection check failed.",
      adminUrl: null,
    },
    {
      key: "nocodb",
      name: "NocoDB",
      status: status(Boolean(process.env.NOCODB_BASE_URL)),
      configured: Boolean(process.env.NOCODB_BASE_URL),
      details: process.env.NOCODB_BASE_URL
        ? "Base URL configured."
        : "Base URL not configured.",
      adminUrl: process.env.NOCODB_BASE_URL || null,
    },
    {
      key: "n8n",
      name: "n8n",
      status: status(Boolean(process.env.N8N_BASE_URL)),
      configured: Boolean(process.env.N8N_BASE_URL),
      details: process.env.N8N_BASE_URL
        ? "Automation endpoint configured."
        : "Automation endpoint not configured.",
      adminUrl: process.env.N8N_BASE_URL || null,
    },
    {
      key: "ai_provider",
      name: "AI Provider",
      status: status(
        Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY),
      ),
      configured: Boolean(
        process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
      ),
      details:
        process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
          ? "At least one provider key exists."
          : "No AI provider key found.",
      adminUrl: null,
    },
    {
      key: "outlook_microsoft_365",
      name: "Outlook / Microsoft 365",
      status: status(
        Boolean(
          process.env.MICROSOFT_CLIENT_ID &&
          process.env.MICROSOFT_CLIENT_SECRET &&
          process.env.MICROSOFT_TENANT_ID,
        ),
      ),
      configured: Boolean(
        process.env.MICROSOFT_CLIENT_ID &&
        process.env.MICROSOFT_CLIENT_SECRET &&
        process.env.MICROSOFT_TENANT_ID,
      ),
      details:
        process.env.MICROSOFT_CLIENT_ID &&
        process.env.MICROSOFT_CLIENT_SECRET &&
        process.env.MICROSOFT_TENANT_ID
          ? "OAuth environment appears configured."
          : "OAuth environment is incomplete.",
      adminUrl: null,
    },
    {
      key: "file_storage",
      name: "File storage",
      status: "configured",
      configured: true,
      details: process.env.FILE_STORAGE_DIR
        ? "Local file storage directory configured."
        : "Using application default local file storage.",
      adminUrl: null,
    },
  ];

  return NextResponse.json({ checkedAt, integrations });
}

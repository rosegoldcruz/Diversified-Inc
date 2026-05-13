import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HttpError, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type IntegrationStatus = {
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
};

function getAiConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    requireRole(["Admin", "Leadership"]);
    let dbHealthy = false;
    try {
      await query("SELECT 1");
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    const n8nBaseConfigured = Boolean(process.env.N8N_BASE_URL);
    const n8nWebhookCount = [
      process.env.N8N_FORM_SUBMITTED_WEBHOOK,
      process.env.N8N_REQUEST_CREATED_WEBHOOK,
      process.env.N8N_TASK_ASSIGNED_WEBHOOK,
      process.env.N8N_TASK_OVERDUE_WEBHOOK,
      process.env.N8N_LOW_INVENTORY_WEBHOOK,
      process.env.N8N_WEEKLY_SUMMARY_WEBHOOK,
    ].filter(Boolean).length;

    const integrationCards: IntegrationStatus[] = [
      {
        key: "postgresql",
        name: "PostgreSQL",
        status: dbHealthy ? "Healthy" : "Error",
        configured: Boolean(process.env.DATABASE_URL),
        purpose: "Primary source of truth for Diversified OS records",
        lastChecked: checkedAt,
        notes: dbHealthy
          ? "Database connection responds to health queries."
          : "Database check failed; verify DATABASE_URL and server availability.",
        clientProductionVisibility: "visible",
      },
      {
        key: "nocodb",
        name: "NocoDB",
        status: process.env.NOCODB_BASE_URL ? "Configured" : "Partial",
        configured: Boolean(process.env.NOCODB_BASE_URL),
        purpose: "Internal admin table management interface",
        lastChecked: checkedAt,
        notes: process.env.NOCODB_BASE_URL
          ? "Base URL is configured for admin access."
          : "No base URL configured in env; app can still run with PostgreSQL only.",
        clientProductionVisibility: "internal",
      },
      {
        key: "n8n",
        name: "n8n",
        status: !n8nBaseConfigured
          ? "Missing"
          : n8nWebhookCount > 0
            ? "Configured"
            : "Partial",
        configured: n8nBaseConfigured,
        purpose: "Automation workflows for internal operations events",
        lastChecked: checkedAt,
        notes: !n8nBaseConfigured
          ? "N8N_BASE_URL is missing."
          : `${n8nWebhookCount} webhook categories configured.`,
        clientProductionVisibility: "internal",
      },
      {
        key: "ai_provider",
        name: "AI Provider",
        status: getAiConfigured() ? "Configured" : "Missing",
        configured: getAiConfigured(),
        purpose: "Powers the internal AI chat and extraction tools",
        lastChecked: checkedAt,
        notes: getAiConfigured()
          ? "At least one AI provider key is configured."
          : "No supported AI API key found.",
        clientProductionVisibility: "visible",
      },
      {
        key: "microsoft_365",
        name: "Outlook / Microsoft 365",
        status: "Not Configured",
        configured: false,
        purpose: "Calendar and mailbox sync",
        lastChecked: checkedAt,
        notes: "No Microsoft 365 sync is configured in this repository.",
        clientProductionVisibility: "internal",
      },
      {
        key: "file_storage",
        name: "File Storage",
        status: "Configured",
        configured: true,
        purpose: "Structured document storage and attachments",
        lastChecked: checkedAt,
        notes: process.env.FILE_STORAGE_DIR
          ? "Local file storage directory is configured."
          : "Using local file storage under the application storage directory.",
        clientProductionVisibility: "internal",
      },
    ];

    return NextResponse.json({
      checkedAt,
      integrations: integrationCards,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load integrations status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

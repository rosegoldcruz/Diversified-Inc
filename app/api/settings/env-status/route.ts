import { NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type EnvVarCheck = {
  key: string;
  configured: boolean;
  required: boolean;
  purpose: string;
};

type EnvGroup = {
  group: string;
  items: EnvVarCheck[];
};

function checkVar(
  key: string,
  required: boolean,
  purpose: string,
): EnvVarCheck {
  return {
    key,
    configured: Boolean(process.env[key]),
    required,
    purpose,
  };
}

function checkOneOf(
  keys: string[],
  required: boolean,
  purpose: string,
): EnvVarCheck {
  const configured = keys.some((key) => Boolean(process.env[key]));
  return {
    key: keys.join(" | "),
    configured,
    required,
    purpose,
  };
}

export async function GET() {
  try {
    requireRole(["Admin", "Leadership"]);
    const groups: EnvGroup[] = [
      {
        group: "Database",
        items: [
          checkVar(
            "DATABASE_URL",
            true,
            "PostgreSQL application connection string",
          ),
        ],
      },
      {
        group: "AI Provider",
        items: [
          checkOneOf(
            ["DEEPSEEK_API_KEY", "OPENAI_API_KEY"],
            true,
            "Enables AI assistant features",
          ),
        ],
      },
      {
        group: "n8n",
        items: [
          checkVar(
            "N8N_BASE_URL",
            true,
            "n8n base URL for automation readiness",
          ),
          checkVar(
            "N8N_WEBHOOK_SECRET",
            false,
            "Shared secret for webhook validation",
          ),
          checkVar(
            "N8N_FORM_SUBMITTED_WEBHOOK",
            false,
            "Workflow endpoint for form submission events",
          ),
          checkVar(
            "N8N_REQUEST_CREATED_WEBHOOK",
            false,
            "Workflow endpoint for new request events",
          ),
          checkVar(
            "N8N_TASK_ASSIGNED_WEBHOOK",
            false,
            "Workflow endpoint for task assignment events",
          ),
          checkVar(
            "N8N_TASK_OVERDUE_WEBHOOK",
            false,
            "Workflow endpoint for overdue task events",
          ),
          checkVar(
            "N8N_LOW_INVENTORY_WEBHOOK",
            false,
            "Workflow endpoint for low inventory events",
          ),
          checkVar(
            "N8N_WEEKLY_SUMMARY_WEBHOOK",
            false,
            "Workflow endpoint for weekly summary events",
          ),
        ],
      },
      {
        group: "Auth / Session",
        items: [
          checkOneOf(
            ["SESSION_SECRET", "NEXTAUTH_SECRET"],
            true,
            "Session signing secret for authenticated flows",
          ),
        ],
      },
      {
        group: "File Storage",
        items: [
          checkOneOf(
            ["STORAGE_BUCKET", "S3_BUCKET", "BLOB_READ_WRITE_TOKEN"],
            false,
            "Optional file storage provider credentials",
          ),
        ],
      },
      {
        group: "App URL",
        items: [
          checkOneOf(
            ["APP_URL", "NEXT_PUBLIC_APP_URL"],
            true,
            "Canonical app URL for links and callbacks",
          ),
        ],
      },
    ];

    const totals = groups.reduce(
      (acc, group) => {
        for (const item of group.items) {
          if (item.required) {
            acc.required += 1;
            if (item.configured) acc.requiredConfigured += 1;
          } else {
            acc.optional += 1;
            if (item.configured) acc.optionalConfigured += 1;
          }
        }
        return acc;
      },
      {
        required: 0,
        requiredConfigured: 0,
        optional: 0,
        optionalConfigured: 0,
      },
    );

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      groups,
      totals,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load env status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

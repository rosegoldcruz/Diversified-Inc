import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { ensureSchema } from "@/lib/schema";
import { HttpError, getSession, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireString,
} from "@/lib/validators";
import { createNotification } from "@/lib/notifications";
import { safeCreateAutomationEvent } from "@/lib/automation-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FormRow = {
  id: number;
  title: string;
  type: string | null;
  submitted_by: number | null;
  status: string | null;
  form_data: Record<string, unknown> | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string | null;
};

type FormWithLinks = FormRow & {
  submitted_by_name: string | null;
  linked_request: {
    id: number;
    request_id: string | null;
    status: string;
  } | null;
};

const FORM_TYPES = [
  "Work Order Request",
  "Vehicle Request",
  "Claim Report",
  "PO Request",
  "Microsoft 365 Access Request",
] as const;

const FORM_TYPE_TO_REQUEST_CATEGORY: Record<
  (typeof FORM_TYPES)[number],
  string
> = {
  "Work Order Request": "Operations",
  "Vehicle Request": "Operations",
  "Claim Report": "Claims",
  "PO Request": "Purchasing",
  "Microsoft 365 Access Request": "IT / Access",
};

const FORM_TYPE_TO_REVIEWER: Record<(typeof FORM_TYPES)[number], string> = {
  "Work Order Request": "Work Orders Queue",
  "Vehicle Request": "Fleet Queue",
  "Claim Report": "Claims Queue",
  "PO Request": "Purchasing Queue",
  "Microsoft 365 Access Request": "IT Access Queue",
};

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const session = requireUser();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const params: unknown[] = [];
    let where = "";
    if (type) {
      params.push(type);
      where = `WHERE f.type = $1`;
    }

    const rows = await query<FormWithLinks>(
      `SELECT
         f.id, f.title, f.type, f.submitted_by, f.status,
         f.form_data, f.submitted_at, f.reviewed_at, f.created_at,
         e.name AS submitted_by_name,
         (
           SELECT json_build_object('id', r.id, 'request_id', r.request_id, 'status', r.status)
           FROM requests r
           WHERE r.linked_form_id = f.id::text
           ORDER BY r.id DESC
           LIMIT 1
         ) AS linked_request
       FROM forms f
       LEFT JOIN employees e ON e.id = f.submitted_by
       ${where}
       ORDER BY f.submitted_at DESC NULLS LAST, f.id DESC
       LIMIT 500`,
      params,
    );

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[forms.GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to load forms";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const session = requireUser();

    const body = (await request.json().catch(() => null)) as {
      type?: unknown;
      title?: unknown;
      data?: unknown;
      priority?: unknown;
    } | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const type = requireString(body.type, "type", 100);
    if (!FORM_TYPES.includes(type as (typeof FORM_TYPES)[number])) {
      return NextResponse.json(
        { error: `type must be one of: ${FORM_TYPES.join(", ")}` },
        { status: 400 },
      );
    }
    const title = optionalString(body.title, "title", 250) ?? type;

    let data: Record<string, unknown> = {};
    if (body.data !== undefined && body.data !== null) {
      if (typeof body.data !== "object" || Array.isArray(body.data)) {
        return NextResponse.json(
          { error: "data must be an object" },
          { status: 400 },
        );
      }
      data = body.data as Record<string, unknown>;
    }

    const priority =
      typeof body.priority === "string" ? body.priority : "Medium";

    const result = await withTransaction(async (q) => {
      const formRows = await q<{ id: number }>(
        `INSERT INTO forms (title, type, submitted_by, status, form_data, submitted_at, created_at)
         VALUES ($1, $2, $3, 'submitted', $4::jsonb, NOW(), NOW())
         RETURNING id`,
        [title, type, session.userId, JSON.stringify(data)],
      );
      const formId = formRows[0].id;

      const year = new Date().getFullYear();
      const seqRows = await q<{ max_seq: number | null }>(
        `SELECT MAX(CAST(SUBSTRING(request_id FROM '[0-9]+$') AS INTEGER)) AS max_seq
         FROM requests
         WHERE request_id LIKE $1`,
        [`REQ-${year}-%`],
      );
      const nextSeq = (seqRows[0]?.max_seq ?? 0) + 1;
      const requestId = `REQ-${year}-${String(nextSeq).padStart(3, "0")}`;
      const category =
        FORM_TYPE_TO_REQUEST_CATEGORY[
          type as keyof typeof FORM_TYPE_TO_REQUEST_CATEGORY
        ];
      const reviewer =
        FORM_TYPE_TO_REVIEWER[type as keyof typeof FORM_TYPE_TO_REVIEWER];

      const requestRows = await q(
        `INSERT INTO requests
           (request_id, title, requester, category, priority, status,
            description, assigned_reviewer, submitted_date, updated_at, linked_form_id, updated_by)
         VALUES ($1, $2, $3, $4, $5, 'Submitted', $6, $7, NOW(), NOW(), $8, $9)
         RETURNING *`,
        [
          requestId,
          title,
          session.name,
          category,
          priority,
          summariseFormData(data),
          reviewer,
          String(formId),
          session.userId,
        ],
      );

      return { form_id: formId, request: requestRows[0] };
    });

    // Fan-out internal notification to Admin/Leadership users.
    await createNotification({
      type: "request.submitted",
      title: `New ${type}`,
      body: `${session.name} submitted ${type}`,
      link: `/requests`,
      audienceRoles: ["Admin", "Leadership", "Manager"],
    });

    await safeCreateAutomationEvent({
      eventType: "form_submitted",
      sourceModule: "forms",
      entityType: "form",
      entityId: result.form_id,
      actorUserId: session.userId,
      path: `/forms`,
      payload: {
        form_id: result.form_id,
        request_id: result.request?.id ?? null,
        request_number: result.request?.request_id ?? null,
        title,
        type,
        priority,
        requester: session.name,
      },
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: "form.submitted",
      module: "forms",
      entityType: "form",
      entityId: result.form_id,
      afterData: result,
      request,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    console.error("[forms.POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit form";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function summariseFormData(data: Record<string, unknown>): string {
  const entries = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .slice(0, 12);
  if (entries.length === 0) return "(no details provided)";
  return entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join("\n");
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

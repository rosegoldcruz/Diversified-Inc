import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notifications";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { HttpError, requireRole } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireEnum,
  requireString,
} from "@/lib/validators";

export const dynamic = "force-dynamic";

const WORK_ORDER_STATUSES = [
  "open",
  "scheduled",
  "in_progress",
  "waiting",
  "completed",
  "cancelled",
] as const;

const WORK_ORDER_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

type WorkOrderPostBody = {
  title?: unknown;
  description?: unknown;
  type?: unknown;
  division?: unknown;
  status?: unknown;
  priority?: unknown;
  owner?: unknown;
  due_date?: unknown;
  notes?: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status")?.toLowerCase();
    const whereClause =
      status === "open"
        ? "WHERE LOWER(COALESCE(w.status, '')) NOT IN ('completed', 'closed', 'cancelled')"
        : "";

    const rows = await query(`
      SELECT
        w.*,
        e.name AS owner_name
      FROM work_orders w
      LEFT JOIN employees e ON w.owner = e.id
      ${whereClause}
      ORDER BY w.due_date ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load work orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    const body = (await request
      .json()
      .catch(() => null)) as WorkOrderPostBody | null;

    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const title = requireString(body.title, "title", 200);
    const description = optionalString(body.description, "description", 5000);
    const type = optionalString(body.type, "type", 100) ?? "General";
    const division =
      optionalString(body.division, "division", 100) ?? "Operations";
    const notes = optionalString(body.notes, "notes", 5000);
    const status = body.status
      ? requireEnum(normalizeText(body.status), WORK_ORDER_STATUSES, "status")
      : "open";
    const priority = body.priority
      ? requireEnum(
          normalizeText(body.priority),
          WORK_ORDER_PRIORITIES,
          "priority",
        )
      : "medium";
    const owner = optionalInteger(body.owner, "owner");
    const dueDate = optionalDate(body.due_date, "due_date");

    if (owner !== null) {
      const employee = await query<{ id: number }>(
        `SELECT id FROM employees WHERE id = $1 LIMIT 1`,
        [owner],
      );
      if (employee.length === 0) {
        return NextResponse.json(
          { error: "owner must reference an existing employee" },
          { status: 400 },
        );
      }
    }

    const rows = await query<{ id: number }>(
      `INSERT INTO work_orders
        (title, description, type, division, status, priority, owner, due_date, notes, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10)
       RETURNING id`,
      [
        title,
        description,
        type,
        division,
        status,
        priority,
        owner,
        dueDate,
        notes,
        session.userId,
      ],
    );

    const workOrder = await getWorkOrderById(rows[0].id);

    await createNotification({
      type: "work_order.created",
      title: `New work order: ${title}`,
      body: `${session.name} created a ${priority} priority work order.`,
      link: `/work-orders/${rows[0].id}`,
      userIds: owner ? [owner] : undefined,
      audienceRoles: owner ? undefined : ["Manager", "Admin", "Leadership"],
      excludeUserId: session.userId,
    });

    await safeCreateAutomationEvent({
      eventType: "work_order_created",
      sourceModule: "work_orders",
      entityType: "work_order",
      entityId: rows[0].id,
      actorUserId: session.userId,
      path: `/work-orders/${rows[0].id}`,
      payload: {
        work_order_id: rows[0].id,
        title,
        type,
        division,
        status,
        priority,
        owner,
        due_date: dueDate,
      },
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: "work_order.created",
      module: "work_orders",
      entityType: "work_order",
      entityId: rows[0].id,
      afterData: workOrder ?? rows[0],
      request,
    });

    return NextResponse.json(workOrder ?? rows[0], { status: 201 });
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
    console.error("[work-orders.POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create work order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getWorkOrderById(workOrderId: number) {
  const rows = await query(
    `SELECT
      w.*,
      e.name AS owner_name
    FROM work_orders w
    LEFT JOIN employees e ON w.owner = e.id
    WHERE w.id = $1`,
    [workOrderId],
  );

  return rows[0] ?? null;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : String(value);
}

function optionalInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer`);
  }
  return parsed;
}

function optionalDate(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${label} must be in YYYY-MM-DD format`);
  }
  return value;
}

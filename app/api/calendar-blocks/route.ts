import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import {
  type CalendarBlockRow,
  ensureCalendarBlocksTable,
  normalizeBlockType,
  normalizeUuid,
  optionalInteger,
  optionalString,
  requireDateTime,
} from "@/lib/calendar-blocks";
import { HttpError, requireUser } from "@/lib/session";
import { ValidationError, requireString } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireUser();
    await ensureCalendarBlocksTable();

    const params = request.nextUrl.searchParams;
    const clauses: string[] = [];
    const values: unknown[] = [];

    const from = params.get("from");
    if (from) {
      values.push(from);
      clauses.push(`cb.end_time >= $${values.length}::timestamptz`);
    }

    const to = params.get("to");
    if (to) {
      values.push(to);
      clauses.push(`cb.start_time <= $${values.length}::timestamptz`);
    }

    const assignedTo = params.get("assigned_to");
    if (assignedTo) {
      const assignedId = Number(assignedTo);
      if (Number.isInteger(assignedId)) {
        values.push(assignedId);
        clauses.push(`cb.assigned_to_employee_id = $${values.length}`);
      } else {
        values.push(assignedTo);
        clauses.push(`cb.assigned_to = $${values.length}::uuid`);
      }
    }

    const company = params.get("company") ?? params.get("company_division");
    if (company) {
      values.push(company);
      clauses.push(`LOWER(cb.company_division) = LOWER($${values.length})`);
    }

    const status = params.get("status");
    if (status) {
      values.push(status);
      clauses.push(`LOWER(cb.status) = LOWER($${values.length})`);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await query<CalendarBlockRow>(
      `SELECT cb.*, e.name AS assigned_to_name
       FROM calendar_blocks cb
       LEFT JOIN employees e ON cb.assigned_to_employee_id = e.id
       ${where}
       ORDER BY cb.start_time ASC`,
      values,
    );

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load calendar blocks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireUser();
    await ensureCalendarBlocksTable();
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const title = requireString(body.title, "title", 250);
    const blockType = normalizeBlockType(body.block_type);
    const startTime = requireDateTime(body.start_time, "start_time");
    const endTime = requireDateTime(body.end_time, "end_time");
    if (endTime.getTime() <= startTime.getTime()) {
      return NextResponse.json(
        { error: "end_time must be after start_time" },
        { status: 400 },
      );
    }

    const rows = await query<CalendarBlockRow>(
      `INSERT INTO calendar_blocks
        (title, description, block_type, status, priority, assigned_to,
         assigned_to_employee_id, linked_task_id, linked_task_int_id,
         linked_work_order_id, linked_work_order_int_id, company_division,
         start_time, end_time, all_day, notes, created_by, created_by_user_id,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
               $13, $14, $15, $16, $17, $18, NOW(), NOW())
       RETURNING *`,
      [
        title,
        optionalString(body.description, 5000),
        blockType,
        optionalString(body.status, 80) ?? "scheduled",
        optionalString(body.priority, 80),
        normalizeUuid(body.assigned_to),
        optionalInteger(body.assigned_to, "assigned_to"),
        normalizeUuid(body.linked_task_id),
        optionalInteger(body.linked_task_id, "linked_task_id"),
        normalizeUuid(body.linked_work_order_id),
        optionalInteger(body.linked_work_order_id, "linked_work_order_id"),
        optionalString(body.company_division, 120),
        startTime.toISOString(),
        endTime.toISOString(),
        Boolean(body.all_day),
        optionalString(body.notes, 5000),
        normalizeUuid(session.userId),
        session.userId,
      ],
    );

    const block = rows[0];
    await createAuditLog({
      actorUserId: session.userId,
      action: "calendar_block.created",
      module: "calendar",
      entityType: "calendar_block",
      entityId: block.id,
      afterData: block,
      request,
    });
    await safeCreateAutomationEvent({
      eventType: "calendar_block_created",
      sourceModule: "calendar",
      entityType: "calendar_block",
      entityId: block.id,
      actorUserId: session.userId,
      path: "/calendar",
      payload: block as unknown as Record<string, unknown>,
    });

    return NextResponse.json(block, { status: 201 });
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
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create calendar block";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import {
  type CalendarBlockRow,
  ensureCalendarBlocksTable,
  normalizeBlockType,
  normalizeUuid,
  optionalInteger,
  optionalString,
  requireDateTime,
} from "@/lib/calendar-blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    requireUser();
    await ensureCalendarBlocksTable();
    const block = await getCalendarBlock(params.id);
    if (!block) {
      return NextResponse.json(
        { error: "Calendar block not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(block);
  } catch (error) {
    return toErrorResponse(error, "Failed to load calendar block");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireUser();
    await ensureCalendarBlocksTable();
    const before = await getCalendarBlock(params.id);
    if (!before) {
      return NextResponse.json(
        { error: "Calendar block not found" },
        { status: 404 },
      );
    }

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

    const updates: string[] = [];
    const values: unknown[] = [];
    const push = (sql: string, value: unknown) => {
      values.push(value);
      updates.push(`${sql} = $${values.length}`);
    };

    if ("title" in body) push("title", optionalString(body.title, 250));
    if ("description" in body) {
      push("description", optionalString(body.description, 5000));
    }
    if ("block_type" in body)
      push("block_type", normalizeBlockType(body.block_type));
    if ("status" in body) push("status", optionalString(body.status, 80));
    if ("priority" in body) push("priority", optionalString(body.priority, 80));
    if ("company_division" in body) {
      push("company_division", optionalString(body.company_division, 120));
    }
    if ("notes" in body) push("notes", optionalString(body.notes, 5000));
    if ("all_day" in body) push("all_day", Boolean(body.all_day));
    if ("assigned_to" in body) {
      push("assigned_to", normalizeUuid(body.assigned_to));
      push(
        "assigned_to_employee_id",
        optionalInteger(body.assigned_to, "assigned_to"),
      );
    }
    if ("linked_task_id" in body) {
      push("linked_task_id", normalizeUuid(body.linked_task_id));
      push(
        "linked_task_int_id",
        optionalInteger(body.linked_task_id, "linked_task_id"),
      );
    }
    if ("linked_work_order_id" in body) {
      push("linked_work_order_id", normalizeUuid(body.linked_work_order_id));
      push(
        "linked_work_order_int_id",
        optionalInteger(body.linked_work_order_id, "linked_work_order_id"),
      );
    }
    if ("start_time" in body) {
      push(
        "start_time",
        requireDateTime(body.start_time, "start_time").toISOString(),
      );
    }
    if ("end_time" in body) {
      push(
        "end_time",
        requireDateTime(body.end_time, "end_time").toISOString(),
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }

    updates.push("updated_at = NOW()");
    values.push(params.id);
    const rows = await query<CalendarBlockRow>(
      `UPDATE calendar_blocks
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Calendar block not found" },
        { status: 404 },
      );
    }

    const after = (await getCalendarBlock(params.id)) ?? rows[0];
    await createAuditLog({
      actorUserId: session.userId,
      action: "calendar_block.updated",
      module: "calendar",
      entityType: "calendar_block",
      entityId: params.id,
      beforeData: before,
      afterData: after,
      request,
    });
    await safeCreateAutomationEvent({
      eventType: "calendar_block_updated",
      sourceModule: "calendar",
      entityType: "calendar_block",
      entityId: params.id,
      actorUserId: session.userId,
      path: "/calendar",
      payload: after as unknown as Record<string, unknown>,
    });

    return NextResponse.json(after);
  } catch (error) {
    return toErrorResponse(error, "Failed to update calendar block");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    await ensureCalendarBlocksTable();
    const before = await getCalendarBlock(params.id);
    if (!before) {
      return NextResponse.json(
        { error: "Calendar block not found" },
        { status: 404 },
      );
    }

    await query(`DELETE FROM calendar_blocks WHERE id = $1`, [params.id]);
    await createAuditLog({
      actorUserId: session.userId,
      action: "calendar_block.deleted",
      module: "calendar",
      entityType: "calendar_block",
      entityId: params.id,
      beforeData: before,
      request,
    });
    await safeCreateAutomationEvent({
      eventType: "calendar_block_deleted",
      sourceModule: "calendar",
      entityType: "calendar_block",
      entityId: params.id,
      actorUserId: session.userId,
      path: "/calendar",
      payload: before as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "Failed to delete calendar block");
  }
}

async function getCalendarBlock(id: string) {
  const rows = await query<CalendarBlockRow>(
    `SELECT cb.*, e.name AS assigned_to_name
     FROM calendar_blocks cb
     LEFT JOIN employees e ON cb.assigned_to_employee_id = e.id
     WHERE cb.id = $1
     LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

function toErrorResponse(error: unknown, fallback: string) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

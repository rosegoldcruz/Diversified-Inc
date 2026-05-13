import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notifications";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { HttpError, requireRole } from "@/lib/session";
import { ValidationError, requireEnum } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

const WORK_ORDER_STATUSES = [
  "open",
  "scheduled",
  "in_progress",
  "waiting",
  "completed",
  "cancelled",
] as const;

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function getWorkOrderById(workOrderId: number) {
  const rows = await query(
    `SELECT
      w.*,
      e.name AS owner_name,
      e.name AS assigned_to_name
    FROM work_orders w
    LEFT JOIN employees e ON w.owner = e.id
    WHERE w.id = $1`,
    [workOrderId],
  );

  return rows[0] ?? null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const workOrderId = parseId(params.id);
  if (!workOrderId) {
    return NextResponse.json(
      { error: "Invalid work order id" },
      { status: 400 },
    );
  }

  try {
    const workOrder = await getWorkOrderById(workOrderId);

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load work order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const workOrderId = parseId(params.id);
  if (!workOrderId) {
    return NextResponse.json(
      { error: "Invalid work order id" },
      { status: 400 },
    );
  }

  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    const body = (await request.json()) as {
      status?: string;
      assigned_to?: number | null;
    };

    const existingWorkOrder = await getWorkOrderById(workOrderId);
    const previousStatus = String(existingWorkOrder?.status ?? "");
    const updates: string[] = [];
    const values: Array<string | number | null> = [];

    if (typeof body.status === "string" && body.status.trim()) {
      values.push(
        requireEnum(
          body.status.trim().toLowerCase(),
          WORK_ORDER_STATUSES,
          "status",
        ),
      );
      updates.push(`status = $${values.length}`);
    }

    if (body.assigned_to !== undefined) {
      if (body.assigned_to !== null) {
        const ownerId = Number(body.assigned_to);
        if (!Number.isInteger(ownerId) || ownerId <= 0) {
          throw new ValidationError("assigned_to must be a positive integer");
        }
        const employee = await query<{ id: number }>(
          `SELECT id FROM employees WHERE id = $1 LIMIT 1`,
          [ownerId],
        );
        if (employee.length === 0) {
          return NextResponse.json(
            { error: "assigned_to must reference an existing employee" },
            { status: 400 },
          );
        }
        body.assigned_to = ownerId;
      }
      values.push(body.assigned_to);
      updates.push(`owner = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Provide status and/or assigned_to" },
        { status: 400 },
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(session.userId);
    updates.push(`updated_by = $${values.length}`);

    values.push(workOrderId);

    const updatedRows = await query(
      `UPDATE work_orders
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    const workOrder = await getWorkOrderById(workOrderId);

    await createAuditLog({
      actorUserId: session.userId,
      action: "work_order.updated",
      module: "work_orders",
      entityType: "work_order",
      entityId: workOrderId,
      beforeData: existingWorkOrder,
      afterData: workOrder ?? updatedRows[0],
      request,
    });

    await createNotification({
      type: "work_order.updated",
      title: `Work order updated: ${String(workOrder?.title ?? workOrderId)}`,
      body: `${session.name} updated work order WO-${workOrderId}.`,
      link: `/work-orders/${workOrderId}`,
      userIds: body.assigned_to ? [body.assigned_to] : undefined,
      excludeUserId: session.userId,
    });

    if (workOrder && String(workOrder.status ?? "") !== previousStatus) {
      await safeCreateAutomationEvent({
        eventType: "work_order_status_changed",
        sourceModule: "work_orders",
        entityType: "work_order",
        entityId: workOrderId,
        actorUserId: session.userId,
        path: `/work-orders/${workOrderId}`,
        payload: {
          work_order_id: workOrderId,
          title: workOrder.title ?? null,
          previous_status: previousStatus || null,
          status: workOrder.status ?? null,
          assigned_to: body.assigned_to ?? null,
        },
      });
    }

    return NextResponse.json(workOrder ?? updatedRows[0]);
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
      error instanceof Error ? error.message : "Failed to update work order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

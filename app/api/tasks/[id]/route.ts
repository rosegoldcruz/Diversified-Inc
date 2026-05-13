import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import {
  canMutateTask,
  HttpError,
  requireRole,
  requireUser,
} from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

class InputValidationError extends Error {}

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function getTaskById(taskId: number) {
  const rows = await query(
    `SELECT
      t.*,
      e.name AS assigned_to_name,
      e.department AS assigned_department
    FROM tasks t
    LEFT JOIN employees e ON t.assigned_to = e.id
    WHERE t.id = $1`,
    [taskId],
  );

  return rows[0] ?? null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const taskId = parseId(params.id);
  if (!taskId) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  try {
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const taskId = parseId(params.id);
  if (!taskId) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  try {
    const session = requireUser();
    const existingTask = await getTaskById(taskId);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (!canMutateTask(session, existingTask)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;

    if ("assigned_to" in body && body.assigned_to !== undefined) {
      requireRole(["Manager", "Admin", "Leadership"]);
    }
    const acceptedFields = [
      "division",
      "topic",
      "notes",
      "start_date",
      "start_time",
      "end_time",
      "all_day",
      "repeat_schedule",
      "estimated_hours",
      "estimated_minutes",
      "is_private",
      "locked",
      "completed_at",
      "status",
      "priority",
      "title",
      "description",
      "due_date",
      "assigned_to",
    ];

    const updates: string[] = [];
    const values: unknown[] = [];

    acceptedFields.forEach((field) => {
      if (!(field in body)) return;
      const normalized = normalizePatchValue(field, body[field]);
      values.push(normalized);
      updates.push(`${field} = $${values.length}`);
    });

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No accepted fields provided" },
        { status: 400 },
      );
    }

    values.push(taskId);

    const updatedRows = await query(
      `UPDATE tasks
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await getTaskById(taskId);
    await createAuditLog({
      actorUserId: session.userId,
      action: "task.updated",
      module: "tasks",
      entityType: "task",
      entityId: taskId,
      beforeData: existingTask,
      afterData: task ?? updatedRows[0],
      request,
    });
    if (
      task &&
      "status" in body &&
      String(body.status).trim().toLowerCase() === "blocked" &&
      String(existingTask.status ?? "").toLowerCase() !== "blocked"
    ) {
      await safeCreateAutomationEvent({
        eventType: "task_blocked",
        sourceModule: "tasks",
        entityType: "task",
        entityId: taskId,
        actorUserId: session.userId,
        path: `/tasks/${taskId}`,
        payload: {
          task_id: taskId,
          title: task.title ?? null,
          assigned_to: task.assigned_to ?? null,
          previous_status: existingTask.status ?? null,
          status: task.status ?? "blocked",
          priority: task.priority ?? null,
        },
      });
    }
    return NextResponse.json(task ?? updatedRows[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof InputValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to update task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizePatchValue(field: string, value: unknown) {
  if (
    field === "estimated_hours" ||
    field === "estimated_minutes" ||
    field === "assigned_to"
  ) {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new InputValidationError(`${field} must be an integer`);
    }
    return parsed;
  }

  if (field === "all_day" || field === "is_private" || field === "locked") {
    return Boolean(value);
  }

  if (field === "start_date" || field === "due_date") {
    if (value === "" || value === null || value === undefined) return null;
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    ) {
      throw new InputValidationError(`${field} must be in YYYY-MM-DD format`);
    }
    return value.trim();
  }

  if (field === "start_time" || field === "end_time") {
    if (value === "" || value === null || value === undefined) return null;
    if (
      typeof value !== "string" ||
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim())
    ) {
      throw new InputValidationError(`${field} must be in HH:MM format`);
    }
    return value.trim();
  }

  if (field === "completed_at") {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value !== "string") {
      throw new InputValidationError(
        "completed_at must be an ISO datetime string",
      );
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new InputValidationError("completed_at must be a valid datetime");
    }
    return parsed.toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return value ?? null;
}

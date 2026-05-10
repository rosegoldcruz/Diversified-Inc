import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

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
    const body = (await request.json()) as Record<string, unknown>;
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
      values.push(normalizePatchValue(field, body[field]));
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
    return NextResponse.json(task ?? updatedRows[0]);
  } catch (error) {
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
    return Number.isInteger(parsed) ? parsed : null;
  }

  if (field === "all_day" || field === "is_private" || field === "locked") {
    return Boolean(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return value ?? null;
}

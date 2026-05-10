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

function isUndefinedColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && (error as { code?: string }).code === "42703";
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
    const body = (await request.json()) as { status?: string };
    const status = body.status?.trim().toLowerCase();

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    let updatedRows;

    try {
      updatedRows = await query(
        `UPDATE tasks
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, taskId],
      );
    } catch (error) {
      if (!isUndefinedColumnError(error)) {
        throw error;
      }

      updatedRows = await query(
        `UPDATE tasks
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, taskId],
      );
    }

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

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { HttpError, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type TaskPostBody = {
  title?: string;
  division?: string;
  topic?: string;
  priority?: string;
  due_date?: string;
  start_date?: string;
  start_time?: string;
  end_time?: string;
  assigned_to?: number | string | null;
  estimated_hours?: number | string;
  estimated_minutes?: number | string;
  description?: string;
  notes?: string;
  all_day?: boolean;
  is_private?: boolean;
  repeat_schedule?: string;
};

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status")?.toLowerCase();
    const priority = request.nextUrl.searchParams
      .get("priority")
      ?.toLowerCase();

    const filters: string[] = [];

    if (status === "blocked") {
      filters.push("LOWER(COALESCE(t.status, '')) = 'blocked'");
    }

    if (priority === "high") {
      filters.push("LOWER(COALESCE(t.priority, '')) = 'high'");
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const rows = await query(`
      SELECT
        t.*,
        e.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      ${whereClause}
      ORDER BY t.due_date ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tasks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    const body = (await request.json()) as TaskPostBody;
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const rows = await query(
      `
      INSERT INTO tasks (
        title,
        description,
        status,
        priority,
        division,
        topic,
        due_date,
        start_date,
        start_time,
        end_time,
        assigned_to,
        estimated_hours,
        estimated_minutes,
        notes,
        all_day,
        is_private,
        repeat_schedule
      )
      VALUES ($1, $2, 'todo', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `,
      [
        title,
        normalizeOptionalText(body.description),
        normalizeOptionalText(body.priority) || "medium",
        normalizeOptionalText(body.division) || "Diversified",
        normalizeOptionalText(body.topic),
        normalizeDate(body.due_date),
        normalizeDate(body.start_date) || normalizeDate(body.due_date),
        normalizeOptionalText(body.start_time) || "09:00",
        normalizeOptionalText(body.end_time) || "10:00",
        normalizeInteger(body.assigned_to),
        normalizeInteger(body.estimated_hours) ?? 0,
        normalizeInteger(body.estimated_minutes) ?? 0,
        normalizeOptionalText(body.notes),
        Boolean(body.all_day),
        Boolean(body.is_private),
        normalizeOptionalText(body.repeat_schedule) || "None",
      ],
    );

    const task = await getTaskWithAssignee(rows[0].id as number);
    await createAuditLog({
      actorUserId: session.userId,
      action: "task.created",
      module: "tasks",
      entityType: "task",
      entityId: rows[0].id as number,
      afterData: task ?? rows[0],
      request,
    });
    return NextResponse.json(task ?? rows[0], { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getTaskWithAssignee(taskId: number) {
  const rows = await query(
    `
      SELECT
        t.*,
        e.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE t.id = $1
    `,
    [taskId],
  );

  return rows[0] ?? null;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  return value.trim().length > 0 ? value : null;
}

function normalizeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

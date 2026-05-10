import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

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

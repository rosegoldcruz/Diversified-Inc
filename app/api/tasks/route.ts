import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        t.*,
        e.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      ORDER BY t.due_date ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tasks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
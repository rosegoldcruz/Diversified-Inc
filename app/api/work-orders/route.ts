import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        w.*,
        e.name AS owner_name
      FROM work_orders w
      LEFT JOIN employees e ON w.owner = e.id
      ORDER BY w.due_date ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load work orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status")?.toLowerCase();
    const whereClause =
      status === "open"
        ? "WHERE LOWER(COALESCE(w.status, '')) NOT IN ('completed', 'closed', 'cancelled')"
        : "";

    const rows = await query(`
      SELECT
        w.*,
        e.name AS owner_name
      FROM work_orders w
      LEFT JOIN employees e ON w.owner = e.id
      ${whereClause}
      ORDER BY w.due_date ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load work orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
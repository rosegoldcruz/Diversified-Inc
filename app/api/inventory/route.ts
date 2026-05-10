import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status")?.toLowerCase();
    const whereClause =
      status === "low_stock"
        ? "WHERE LOWER(COALESCE(status, '')) = 'low_stock'"
        : "";

    const rows = await query(`
      SELECT *
      FROM inventory
      ${whereClause}
      ORDER BY status ASC, item_name ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(`
      SELECT
        s.*,
        e.name AS owner_name
      FROM sops s
      LEFT JOIN employees e ON s.owner = e.id
      ORDER BY s.category ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load SOPs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPERVISOR_ROLES = new Set(["Manager", "Admin", "Leadership"]);

export async function GET() {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const isSupervisor = SUPERVISOR_ROLES.has(session.role);
    const rows = isSupervisor
      ? await query(
          `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
           FROM timeclock_entries
           WHERE clock_out IS NULL
           ORDER BY clock_in ASC`,
        )
      : await query(
          `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
           FROM timeclock_entries
           WHERE clock_out IS NULL
             AND (employee_id = $1 OR employee_name = $2)
           ORDER BY clock_in ASC`,
          [session.userId, session.name],
        );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching active timeclock entries:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch active entries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

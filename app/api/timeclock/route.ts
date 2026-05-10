import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(
      `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
       FROM timeclock_entries
       ORDER BY clock_in DESC
       LIMIT 50`,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching timeclock entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeclock entries" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { employee_name, action } = await req.json();

    if (action === "in") {
      const result = await query(
        `INSERT INTO timeclock_entries (employee_name, clock_in, clock_out)
         VALUES ($1, NOW(), NULL)
         RETURNING *`,
        [employee_name],
      );
      return NextResponse.json(result[0]);
    }

    if (action === "out") {
      const result = await query(
        `UPDATE timeclock_entries
         SET clock_out = NOW()
         WHERE id = (
           SELECT id FROM timeclock_entries
           WHERE employee_name = $1 AND clock_out IS NULL
           ORDER BY clock_in DESC LIMIT 1
         )
         RETURNING *`,
        [employee_name],
      );
      if (result.length === 0) {
        return NextResponse.json(
          { error: "No active clock-in found" },
          { status: 404 },
        );
      }
      return NextResponse.json(result[0]);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing timeclock punch:", error);
    return NextResponse.json(
      { error: "Failed to process punch" },
      { status: 500 },
    );
  }
}

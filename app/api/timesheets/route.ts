import { query } from "@/lib/db";
import { HttpError, requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = requireUser();
    const isManagerLevel =
      session.role === "Manager" ||
      session.role === "Admin" ||
      session.role === "Leadership";
    const result = isManagerLevel
      ? await query(
          `SELECT id, employee_id, employee_name, week_start, week_end,
                  monday_hours, tuesday_hours, wednesday_hours, thursday_hours,
                  friday_hours, saturday_hours, sunday_hours, total_hours,
                  status, submitted_at, approved_by, notes, created_at
           FROM timesheets
           ORDER BY week_start DESC`,
        )
      : await query(
          `SELECT id, employee_id, employee_name, week_start, week_end,
                  monday_hours, tuesday_hours, wednesday_hours, thursday_hours,
                  friday_hours, saturday_hours, sunday_hours, total_hours,
                  status, submitted_at, approved_by, notes, created_at
           FROM timesheets
           WHERE employee_id = $1 OR employee_name = $2
           ORDER BY week_start DESC`,
          [session.userId, session.name],
        );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Error fetching timesheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch timesheets" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireUser();
    const {
      week_start,
      week_end,
      monday_hours,
      tuesday_hours,
      wednesday_hours,
      thursday_hours,
      friday_hours,
      saturday_hours,
      sunday_hours,
      notes,
    } = await req.json();

    const result = await query(
      `INSERT INTO timesheets
       (employee_id, employee_name, week_start, week_end, monday_hours, tuesday_hours, wednesday_hours,
        thursday_hours, friday_hours, saturday_hours, sunday_hours, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12)
       RETURNING *`,
      [
        session.userId,
        session.name,
        week_start,
        week_end,
        monday_hours,
        tuesday_hours,
        wednesday_hours,
        thursday_hours,
        friday_hours,
        saturday_hours,
        sunday_hours,
        notes,
      ],
    );
    return NextResponse.json(result[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Error creating timesheet:", error);
    return NextResponse.json(
      { error: "Failed to create timesheet" },
      { status: 500 },
    );
  }
}

import { query } from "@/lib/db";
import { HttpError, requireUser } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const EXCEPTION_ACTIVE_SHIFT_HOURS = 16;

export async function GET() {
  try {
    const session = requireUser();
    const isManagerLevel =
      session.role === "Manager" ||
      session.role === "Admin" ||
      session.role === "Leadership";

    const baseSelect = `
      SELECT t.id, t.employee_id, t.employee_name, t.week_start, t.week_end,
             t.monday_hours, t.tuesday_hours, t.wednesday_hours, t.thursday_hours,
             t.friday_hours, t.saturday_hours, t.sunday_hours, t.total_hours,
             t.status, t.submitted_at, t.approved_by, t.notes, t.created_at,
             COALESCE(ex.exception_open_entries, 0) AS exception_open_entries,
             COALESCE(ex.warning_open_entries, 0) AS warning_open_entries
      FROM timesheets t
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE te.clock_out IS NULL
              AND te.clock_in < NOW() - INTERVAL '${EXCEPTION_ACTIVE_SHIFT_HOURS} hours'
              AND te.clock_in::date BETWEEN t.week_start AND t.week_end
          )::int AS exception_open_entries,
          COUNT(*) FILTER (
            WHERE te.clock_out IS NULL
              AND te.clock_in >= NOW() - INTERVAL '${EXCEPTION_ACTIVE_SHIFT_HOURS} hours'
              AND te.clock_in < NOW() - INTERVAL '12 hours'
              AND te.clock_in::date BETWEEN t.week_start AND t.week_end
          )::int AS warning_open_entries
        FROM timeclock_entries te
        WHERE te.employee_id = t.employee_id
      ) ex ON TRUE
    `;

    const result = isManagerLevel
      ? await query(
          `${baseSelect}
           ORDER BY week_start DESC`,
        )
      : await query(
          `${baseSelect}
           WHERE (employee_id = $1 OR employee_name = $2)
           ORDER BY week_start DESC`,
          [session.userId, session.name],
        );

    const payload = result.map((row) => {
      const exceptionCount = Number((row as { exception_open_entries?: unknown }).exception_open_entries ?? 0);
      const warningCount = Number((row as { warning_open_entries?: unknown }).warning_open_entries ?? 0);
      const needsReview = exceptionCount > 0;

      return {
        ...row,
        exception_open_entries: exceptionCount,
        warning_open_entries: warningCount,
        needs_review: needsReview,
        review_state: needsReview ? "needs_review" : (row as { status: string }).status,
      };
    });

    return NextResponse.json(payload);
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

import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import {
  canApproveTimesheet,
  HttpError,
  requireRole,
  requireUser,
} from "@/lib/session";
import { optionalString } from "@/lib/validators";
import { NextRequest, NextResponse } from "next/server";

const TIMESHEET_STATUSES = new Set([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);
const EXCEPTION_ACTIVE_SHIFT_HOURS = 16;

type TimesheetRow = {
  id: number;
  employee_id: number | null;
  employee_name: string;
  week_start: string;
  week_end: string;
  monday_hours: string | number;
  tuesday_hours: string | number;
  wednesday_hours: string | number;
  thursday_hours: string | number;
  friday_hours: string | number;
  saturday_hours: string | number;
  sunday_hours: string | number;
  total_hours: string | number;
  status: string;
  submitted_at: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
};

type TimesheetPunchRow = {
  id: number;
  employee_id: number | null;
  employee_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  notes: string | null;
  created_at: string;
};

function parseHoursValue(value: unknown, label: string) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 24) {
    throw new HttpError(400, `${label} must be a number between 0 and 24`);
  }
  return Number(numeric.toFixed(2));
}

function mapNeedsReview(
  timesheet: TimesheetRow,
  exceptionOpenEntries: number,
  warningOpenEntries: number,
) {
  const needsReview = exceptionOpenEntries > 0;

  return {
    ...timesheet,
    exception_open_entries: exceptionOpenEntries,
    warning_open_entries: warningOpenEntries,
    needs_review: needsReview,
    review_state: needsReview ? "needs_review" : timesheet.status,
  };
}

async function getTimesheetRow(timesheetId: number) {
  const rows = await query<TimesheetRow>(
    `SELECT id,
            employee_id,
            employee_name,
            week_start,
            week_end,
            monday_hours,
            tuesday_hours,
            wednesday_hours,
            thursday_hours,
            friday_hours,
            saturday_hours,
            sunday_hours,
            total_hours,
            status,
            submitted_at,
            approved_by,
            notes,
            created_at
     FROM timesheets
     WHERE id = $1
     LIMIT 1`,
    [timesheetId],
  );

  return rows[0] ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = requireUser();
    const timesheetId = Number(params.id);

    if (!Number.isInteger(timesheetId) || timesheetId <= 0) {
      return NextResponse.json(
        { error: "Invalid timesheet id" },
        { status: 400 },
      );
    }

    const timesheet = await getTimesheetRow(timesheetId);
    if (!timesheet) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 },
      );
    }

    const isManagerLevel =
      session.role === "Manager" ||
      session.role === "Admin" ||
      session.role === "Leadership";

    if (!isManagerLevel && timesheet.employee_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [exceptionRows, warningRows, punchRows] = await Promise.all([
      timesheet.employee_id === null
        ? Promise.resolve([{ count: "0" }])
        : query<{ count: string }>(
            `SELECT COUNT(*)::text AS count
             FROM timeclock_entries
             WHERE employee_id = $1
               AND clock_out IS NULL
               AND clock_in < NOW() - INTERVAL '${EXCEPTION_ACTIVE_SHIFT_HOURS} hours'
               AND clock_in::date BETWEEN $2::date AND $3::date`,
            [timesheet.employee_id, timesheet.week_start, timesheet.week_end],
          ),
      timesheet.employee_id === null
        ? Promise.resolve([{ count: "0" }])
        : query<{ count: string }>(
            `SELECT COUNT(*)::text AS count
             FROM timeclock_entries
             WHERE employee_id = $1
               AND clock_out IS NULL
               AND clock_in >= NOW() - INTERVAL '${EXCEPTION_ACTIVE_SHIFT_HOURS} hours'
               AND clock_in < NOW() - INTERVAL '12 hours'
               AND clock_in::date BETWEEN $2::date AND $3::date`,
            [timesheet.employee_id, timesheet.week_start, timesheet.week_end],
          ),
      timesheet.employee_id === null
        ? Promise.resolve([] as TimesheetPunchRow[])
        : query<TimesheetPunchRow>(
            `SELECT id,
                    employee_id,
                    employee_name,
                    clock_in,
                    clock_out,
                    total_minutes,
                    notes,
                    created_at
             FROM timeclock_entries
             WHERE employee_id = $1
               AND clock_in::date BETWEEN $2::date AND $3::date
             ORDER BY clock_in ASC`,
            [timesheet.employee_id, timesheet.week_start, timesheet.week_end],
          ),
    ]);

    const exceptionOpenEntries = Number(exceptionRows[0]?.count || "0");
    const warningOpenEntries = Number(warningRows[0]?.count || "0");

    return NextResponse.json({
      timesheet: mapNeedsReview(
        timesheet,
        exceptionOpenEntries,
        warningOpenEntries,
      ),
      punches: punchRows,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Error fetching timesheet detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch timesheet detail" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = requireUser();
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const status = body?.status;
    const timesheetId = Number(params.id);

    if (!Number.isInteger(timesheetId) || timesheetId <= 0) {
      return NextResponse.json(
        { error: "Invalid timesheet id" },
        { status: 400 },
      );
    }

    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const existingRows = await query<TimesheetRow>(
      `SELECT id,
              employee_id,
              employee_name,
              week_start,
              week_end,
              monday_hours,
              tuesday_hours,
              wednesday_hours,
              thursday_hours,
              friday_hours,
              saturday_hours,
              sunday_hours,
              total_hours,
              status,
              submitted_at,
              approved_by,
              notes,
              created_at
       FROM timesheets
       WHERE id = $1`,
      [timesheetId],
    );

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 },
      );
    }

    const dailyFieldMap = [
      { key: "monday_hours", column: "monday_hours" },
      { key: "tuesday_hours", column: "tuesday_hours" },
      { key: "wednesday_hours", column: "wednesday_hours" },
      { key: "thursday_hours", column: "thursday_hours" },
      { key: "friday_hours", column: "friday_hours" },
      { key: "saturday_hours", column: "saturday_hours" },
      { key: "sunday_hours", column: "sunday_hours" },
    ] as const;

    const notes = optionalString(body.notes, "notes", 4000);
    const hasNotes = Object.prototype.hasOwnProperty.call(body, "notes");

    const hourUpdates = dailyFieldMap
      .filter(({ key }) => Object.prototype.hasOwnProperty.call(body, key))
      .map(({ key, column }) => ({
        column,
        value: parseHoursValue(body[key], key),
      }));

    const hasStatus = typeof status === "string";
    const wantsStatusUpdate = hasStatus && TIMESHEET_STATUSES.has(status);
    const nextStatus = wantsStatusUpdate ? (status as string) : null;

    if (hasStatus && !wantsStatusUpdate) {
      return NextResponse.json(
        { error: "Invalid timesheet status" },
        { status: 400 },
      );
    }

    const isManagerLevel =
      session.role === "Manager" ||
      session.role === "Admin" ||
      session.role === "Leadership";
    const ownsTimesheet = existing.employee_id === session.userId;

    const wantsFieldEdit = hourUpdates.length > 0 || hasNotes;
    if (!wantsStatusUpdate && !wantsFieldEdit) {
      return NextResponse.json(
        { error: "No valid timesheet fields provided" },
        { status: 400 },
      );
    }

    if (wantsFieldEdit) {
      if (!ownsTimesheet && !isManagerLevel) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!isManagerLevel && existing.status === "approved") {
        return NextResponse.json(
          { error: "Approved timesheets cannot be edited" },
          { status: 409 },
        );
      }
    }

    if (nextStatus === "approved" || nextStatus === "rejected") {
      requireRole(["Manager", "Admin", "Leadership"]);
      if (!canApproveTimesheet(session, existing)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (nextStatus === "approved" && existing.employee_id !== null) {
        const openException = await query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM timeclock_entries
           WHERE employee_id = $1
             AND clock_out IS NULL
             AND clock_in < NOW() - INTERVAL '${EXCEPTION_ACTIVE_SHIFT_HOURS} hours'
             AND clock_in::date BETWEEN $2::date AND $3::date`,
          [existing.employee_id, existing.week_start, existing.week_end],
        );

        if (Number(openException[0]?.count || "0") > 0) {
          return NextResponse.json(
            {
              error:
                "Cannot approve this timesheet while open 16h+ punches still need review.",
            },
            { status: 409 },
          );
        }
      }
    } else if (wantsStatusUpdate && !ownsTimesheet && !isManagerLevel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateSet: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (wantsStatusUpdate && nextStatus) {
      updateSet.push(`status = $${paramIndex}`);
      values.push(nextStatus);
      paramIndex++;

      if (nextStatus === "submitted") {
        updateSet.push(`submitted_at = NOW()`);
      }

      if (nextStatus === "approved" || nextStatus === "rejected") {
        updateSet.push(`approved_by = $${paramIndex}`);
        values.push(String(session.userId));
        paramIndex++;
      }
    }

    for (const item of hourUpdates) {
      updateSet.push(`${item.column} = $${paramIndex}`);
      values.push(item.value);
      paramIndex++;
    }

    if (hasNotes) {
      updateSet.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    if (updateSet.length === 0) {
      return NextResponse.json(
        { error: "No valid timesheet updates provided" },
        { status: 400 },
      );
    }

    const result = await query(
      `UPDATE timesheets
       SET ${updateSet.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING *`,
      [...values, timesheetId],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 },
      );
    }

    await createAuditLog({
      actorUserId: session.userId,
      action: wantsStatusUpdate
        ? nextStatus === "submitted"
          ? "timesheet.submitted"
          : nextStatus === "approved"
            ? "timesheet.approved"
            : nextStatus === "rejected"
              ? "timesheet.rejected"
              : "timesheet.updated"
        : "timesheet.updated",
      module: "timesheets",
      entityType: "timesheet",
      entityId: timesheetId,
      beforeData: existing,
      afterData: result[0],
      request: req,
    });

    if (nextStatus === "submitted") {
      await safeCreateAutomationEvent({
        eventType: "timesheet_submitted",
        sourceModule: "timesheets",
        entityType: "timesheet",
        entityId: timesheetId,
        actorUserId: session.userId,
        path: "/timesheets",
        payload: {
          timesheet_id: timesheetId,
          employee_id: existing.employee_id,
          employee_name: existing.employee_name,
          previous_status: existing.status,
          status: nextStatus,
        },
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Error updating timesheet:", error);
    return NextResponse.json(
      { error: "Failed to update timesheet" },
      { status: 500 },
    );
  }
}

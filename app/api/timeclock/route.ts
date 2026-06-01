import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { safeCreateAuditLog } from "@/lib/audit-log";
import { HttpError, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireInteger,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANAGE_TIMECLOCK_ROLES = new Set(["Manager", "Admin", "Leadership"]);
const EXCEPTION_ACTIVE_SHIFT_HOURS = 16;
type TimeclockAction = "in" | "out" | "manual";

const ACTION_ALIASES: Record<string, TimeclockAction> = {
  in: "in",
  clock_in: "in",
  "clock-in": "in",
  out: "out",
  clock_out: "out",
  "clock-out": "out",
  manual: "manual",
  correction: "manual",
  manual_correction: "manual",
};

type EmployeeRow = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  status: string | null;
};

type TimeclockEntryRow = {
  id: number;
  employee_id: number | null;
  employee_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  notes: string | null;
  created_at: string;
};

function isTimeclockManager(role: string) {
  return MANAGE_TIMECLOCK_ROLES.has(role);
}

function parseAction(value: unknown): TimeclockAction {
  if (typeof value !== "string") {
    throw new ValidationError("action is required", {
      allowed: Object.keys(ACTION_ALIASES).join(", "),
    });
  }
  const normalized = ACTION_ALIASES[value.trim().toLowerCase()];
  if (!normalized) {
    throw new ValidationError("Invalid action", {
      allowed: Object.keys(ACTION_ALIASES).join(", "),
    });
  }
  return normalized;
}

function parseDateTime(value: unknown, label: string): Date {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${label} is required`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label} must be a valid date/time`);
  }
  return date;
}

function minutesSince(clockInIso: string) {
  const clockInTime = new Date(clockInIso).getTime();
  if (Number.isNaN(clockInTime)) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - clockInTime) / 60000));
}

function publicEntry(row: TimeclockEntryRow) {
  const isManual =
    typeof row.notes === "string" &&
    /^(manual adjustment|admin clock-|admin punch)/i.test(row.notes);

  return {
    ...row,
    source: isManual ? "manual" : "self",
    is_manual: isManual,
  };
}

function toError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 400 },
    );
  }
  console.error("[timeclock]", error);
  return NextResponse.json(
    { error: "Failed to process timeclock request" },
    { status: 500 },
  );
}

async function getSessionEmployee() {
  const session = requireUser();
  const rows = await query<EmployeeRow>(
    `SELECT id, name, email, role, department, status
     FROM employees
     WHERE id = $1
     LIMIT 1`,
    [session.userId],
  );

  if (rows.length === 0) {
    throw new HttpError(403, "No employee profile linked to this user");
  }
  if (rows[0].status !== "active") {
    throw new HttpError(403, "Employee profile is inactive");
  }

  return { session, employee: rows[0] };
}

async function getEmployeeById(employeeId: number) {
  const rows = await query<EmployeeRow>(
    `SELECT id, name, email, role, department, status
     FROM employees
     WHERE id = $1
     LIMIT 1`,
    [employeeId],
  );
  return rows[0] ?? null;
}

async function resolveTargetEmployee(options: {
  requestedEmployeeId: unknown;
  actor: EmployeeRow;
  canManageTimeclock: boolean;
}) {
  let targetEmployeeId = options.actor.id;

  if (
    options.requestedEmployeeId !== undefined &&
    options.requestedEmployeeId !== null &&
    options.requestedEmployeeId !== ""
  ) {
    targetEmployeeId = requireInteger(
      options.requestedEmployeeId,
      "employee_id",
      { min: 1 },
    );
  }

  if (targetEmployeeId !== options.actor.id && !options.canManageTimeclock) {
    throw new HttpError(
      403,
      "You do not have permission to punch for another employee",
    );
  }

  if (targetEmployeeId === options.actor.id) {
    return options.actor;
  }

  const target = await getEmployeeById(targetEmployeeId);
  if (!target) {
    throw new HttpError(404, "Employee not found");
  }
  if (target.status !== "active") {
    throw new HttpError(409, "Cannot punch for an inactive employee");
  }
  return target;
}

async function getActiveEntry(employeeId: number) {
  const rows = await query<TimeclockEntryRow>(
    `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
     FROM timeclock_entries
     WHERE employee_id = $1 AND clock_out IS NULL
     ORDER BY clock_in DESC
     LIMIT 1`,
    [employeeId],
  );
  return rows[0] ? publicEntry(rows[0]) : null;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const { session, employee } = await getSessionEmployee();
    const canManageTimeclock = isTimeclockManager(session.role);
    const requestedEmployeeId =
      request.nextUrl.searchParams.get("employee_id") ??
      request.nextUrl.searchParams.get("employeeId");

    if (canManageTimeclock && !requestedEmployeeId) {
      const rows = await query<TimeclockEntryRow>(
        `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
         FROM timeclock_entries
         ORDER BY clock_in DESC
         LIMIT 100`,
      );
      return NextResponse.json(rows.map(publicEntry));
    }

    const target = await resolveTargetEmployee({
      requestedEmployeeId,
      actor: employee,
      canManageTimeclock,
    });

    const rows = await query<TimeclockEntryRow>(
      `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
       FROM timeclock_entries
       WHERE employee_id = $1
       ORDER BY clock_in DESC
       LIMIT 100`,
      [target.id],
    );
    return NextResponse.json(rows.map(publicEntry));
  } catch (error) {
    return toError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { session, employee } = await getSessionEmployee();
    const canManageTimeclock = isTimeclockManager(session.role);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const action = parseAction(body.action);
    const target = await resolveTargetEmployee({
      requestedEmployeeId: body.employee_id ?? body.employeeId,
      actor: employee,
      canManageTimeclock,
    });
    const notes = optionalString(body.notes, "notes", 1000);
    const isOnBehalf = target.id !== employee.id;

    if (action === "manual") {
      if (!canManageTimeclock) {
        return NextResponse.json(
          { error: "Only Admin or Leadership can create manual corrections" },
          { status: 403 },
        );
      }

      const clockIn = parseDateTime(body.clock_in ?? body.clockIn, "clock_in");
      const clockOut = parseDateTime(
        body.clock_out ?? body.clockOut,
        "clock_out",
      );

      if (clockOut.getTime() < clockIn.getTime()) {
        return NextResponse.json(
          { error: "clock_out must be after clock_in" },
          { status: 400 },
        );
      }

      const manualNotes = `Manual adjustment by ${employee.name}: ${
        notes || "created punch correction"
      }`;
      const rows = await query<TimeclockEntryRow>(
        `INSERT INTO timeclock_entries
          (employee_id, employee_name, clock_in, clock_out, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at`,
        [target.id, target.name, clockIn.toISOString(), clockOut.toISOString(), manualNotes],
      );
      const entry = publicEntry(rows[0]);

      await safeCreateAuditLog({
        actorUserId: session.userId,
        action: "timeclock.manual_correction",
        module: "timeclock",
        entityType: "timeclock_entry",
        entityId: entry.id,
        beforeData: null,
        afterData: entry,
        request: req,
      });

      return NextResponse.json(entry, { status: 201 });
    }

    if (action === "in") {
      const activeEntry = await getActiveEntry(target.id);
      if (activeEntry) {
        return NextResponse.json(
          { error: "Already clocked in", activeEntry },
          { status: 409 },
        );
      }

      const punchNotes = isOnBehalf
        ? `Admin clock-in by ${employee.name}${notes ? `: ${notes}` : ""}`
        : notes;
      const rows = await query<TimeclockEntryRow>(
        `INSERT INTO timeclock_entries (employee_id, employee_name, clock_in, clock_out, notes)
         VALUES ($1, $2, NOW(), NULL, $3)
         RETURNING id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at`,
        [target.id, target.name, punchNotes],
      );
      const entry = publicEntry(rows[0]);

      if (isOnBehalf) {
        await safeCreateAuditLog({
          actorUserId: session.userId,
          action: "timeclock.clock_in_on_behalf",
          module: "timeclock",
          entityType: "timeclock_entry",
          entityId: entry.id,
          beforeData: null,
          afterData: entry,
          request: req,
        });
      }

      return NextResponse.json(entry, { status: 201 });
    }

    const beforeEntry = await getActiveEntry(target.id);
    if (!beforeEntry) {
      return NextResponse.json(
        { error: "No active clock-in found" },
        { status: 409 },
      );
    }

    const elapsedMinutes = minutesSince(beforeEntry.clock_in);
    const requiresManagerReview =
      elapsedMinutes !== null && elapsedMinutes >= EXCEPTION_ACTIVE_SHIFT_HOURS * 60;

    if (requiresManagerReview && !canManageTimeclock) {
      return NextResponse.json(
        {
          error:
            "Open punch exceeds 16 hours and requires manager review for correction.",
        },
        { status: 409 },
      );
    }

    let resolvedClockOut = new Date();
    if (canManageTimeclock && (body.clock_out ?? body.clockOut)) {
      resolvedClockOut = parseDateTime(body.clock_out ?? body.clockOut, "clock_out");
    }

    if (resolvedClockOut.getTime() <= new Date(beforeEntry.clock_in).getTime()) {
      return NextResponse.json(
        { error: "clock_out must be after clock_in" },
        { status: 400 },
      );
    }

    const punchNotes = isOnBehalf
      ? `Admin clock-out by ${employee.name}${notes ? `: ${notes}` : ""}`
      : notes;
    const rows = await query<TimeclockEntryRow>(
      `UPDATE timeclock_entries
       SET clock_out = $2,
           notes = CASE
             WHEN $3::text IS NULL OR $3::text = '' THEN notes
             WHEN notes IS NULL OR notes = '' THEN $3::text
             ELSE notes || E'\n' || $3::text
           END
       WHERE id = $1
       RETURNING id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at`,
      [beforeEntry.id, resolvedClockOut.toISOString(), punchNotes],
    );
    const entry = publicEntry(rows[0]);

    if (isOnBehalf) {
      await safeCreateAuditLog({
        actorUserId: session.userId,
        action: "timeclock.clock_out_on_behalf",
        module: "timeclock",
        entityType: "timeclock_entry",
        entityId: entry.id,
        beforeData: beforeEntry,
        afterData: entry,
        request: req,
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    return toError(error);
  }
}

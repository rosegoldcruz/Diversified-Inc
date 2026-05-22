import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { HttpError, requireUser } from "@/lib/session";
import { ValidationError, requireInteger } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANAGE_TIMECLOCK_ROLES = new Set(["Admin", "Leadership"]);

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

function publicEmployee(employee: EmployeeRow) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    status: employee.status,
  };
}

function publicSessionUser(employee: EmployeeRow, role: string) {
  return {
    ...publicEmployee(employee),
    role,
  };
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
  console.error("[timeclock.active]", error);
  return NextResponse.json(
    { error: "Failed to load timeclock status" },
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

async function resolveSelectedEmployee(options: {
  requestedEmployeeId: string | null;
  actor: EmployeeRow;
  canManageTimeclock: boolean;
}) {
  if (!options.requestedEmployeeId) {
    return options.actor;
  }

  const requestedId = requireInteger(
    options.requestedEmployeeId,
    "employee_id",
    { min: 1 },
  );

  if (requestedId !== options.actor.id && !options.canManageTimeclock) {
    throw new HttpError(
      403,
      "You do not have permission to view another employee's timeclock",
    );
  }

  if (requestedId === options.actor.id) {
    return options.actor;
  }

  const selected = await getEmployeeById(requestedId);
  if (!selected) {
    throw new HttpError(404, "Employee not found");
  }
  return selected;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const { session, employee } = await getSessionEmployee();
    const canManageTimeclock = isTimeclockManager(session.role);
    const requestedEmployeeId =
      request.nextUrl.searchParams.get("employee_id") ??
      request.nextUrl.searchParams.get("employeeId");
    const selectedEmployee = await resolveSelectedEmployee({
      requestedEmployeeId,
      actor: employee,
      canManageTimeclock,
    });

    const [activeRows, recentRows, employees, allActiveRows] =
      await Promise.all([
        query<TimeclockEntryRow>(
          `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
           FROM timeclock_entries
           WHERE employee_id = $1 AND clock_out IS NULL
           ORDER BY clock_in DESC
           LIMIT 1`,
          [selectedEmployee.id],
        ),
        query<TimeclockEntryRow>(
          `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
           FROM timeclock_entries
           WHERE employee_id = $1
           ORDER BY clock_in DESC
           LIMIT 50`,
          [selectedEmployee.id],
        ),
        canManageTimeclock
          ? query<EmployeeRow>(
              `SELECT id, name, email, role, department, status
               FROM employees
               WHERE status = 'active'
               ORDER BY name ASC`,
            )
          : Promise.resolve([]),
        canManageTimeclock
          ? query<TimeclockEntryRow>(
              `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
               FROM timeclock_entries
               WHERE clock_out IS NULL
               ORDER BY clock_in ASC`,
            )
          : Promise.resolve([]),
      ]);

    return NextResponse.json({
      user: publicSessionUser(employee, session.role),
      canManageTimeclock,
      managerScope: canManageTimeclock ? "all" : "self",
      selectedEmployee: publicEmployee(selectedEmployee),
      activeEntry: activeRows[0] ? publicEntry(activeRows[0]) : null,
      recentEntries: recentRows.map(publicEntry),
      activeEntries: allActiveRows.map(publicEntry),
      employees: employees.map(publicEmployee),
    });
  } catch (error) {
    return toError(error);
  }
}

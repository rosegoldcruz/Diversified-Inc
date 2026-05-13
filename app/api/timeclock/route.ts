import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { HttpError, getSession, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireEnum,
  requireInteger,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = ["in", "out"] as const;
const SUPERVISOR_ROLES = new Set(["Manager", "Admin", "Leadership"]);

type EmployeeRow = {
  id: number;
  name: string;
  status: string;
};

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
  const message =
    error instanceof Error ? error.message : "Failed to process punch";
  return NextResponse.json({ error: message }, { status: 500 });
}

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
           ORDER BY clock_in DESC
           LIMIT 100`,
        )
      : await query(
          `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
           FROM timeclock_entries
           WHERE employee_name = $1 OR employee_id = $2
           ORDER BY clock_in DESC
           LIMIT 100`,
          [session.name, session.userId],
        );
    return NextResponse.json(rows);
  } catch (error) {
    return toError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const session = requireUser();
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

    const action = requireEnum(body.action, ACTIONS, "action");

    // Resolve target employee. Default to the current session user.
    let targetEmployeeId = session.userId;
    let targetEmployeeName = session.name;

    if (
      "employee_id" in body &&
      body.employee_id !== undefined &&
      body.employee_id !== null
    ) {
      const requestedId = requireInteger(body.employee_id, "employee_id", {
        min: 1,
      });
      if (requestedId !== session.userId) {
        if (!SUPERVISOR_ROLES.has(session.role)) {
          return NextResponse.json(
            {
              error:
                "Only Manager, Admin, or Leadership can punch on behalf of another employee",
            },
            { status: 403 },
          );
        }
        const rows = await query<EmployeeRow>(
          `SELECT id, name, status FROM employees WHERE id = $1 LIMIT 1`,
          [requestedId],
        );
        if (rows.length === 0) {
          return NextResponse.json(
            { error: "Employee not found" },
            { status: 404 },
          );
        }
        if (rows[0].status !== "active") {
          return NextResponse.json(
            { error: "Cannot punch for an inactive employee" },
            { status: 409 },
          );
        }
        targetEmployeeId = rows[0].id;
        targetEmployeeName = rows[0].name;
      }
    }

    const notes = optionalString(body.notes, "notes", 1000);

    if (action === "in") {
      const open = await query<{ id: number }>(
        `SELECT id FROM timeclock_entries
         WHERE employee_id = $1 AND clock_out IS NULL
         LIMIT 1`,
        [targetEmployeeId],
      );
      if (open.length > 0) {
        return NextResponse.json(
          { error: "Already clocked in" },
          { status: 409 },
        );
      }
      const rows = await query(
        `INSERT INTO timeclock_entries (employee_id, employee_name, clock_in, clock_out, notes)
         VALUES ($1, $2, NOW(), NULL, $3)
         RETURNING *`,
        [targetEmployeeId, targetEmployeeName, notes],
      );
      return NextResponse.json(rows[0], { status: 201 });
    }

    const rows = await query(
      `UPDATE timeclock_entries
       SET clock_out = NOW(),
           total_minutes = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 60)),
           notes = COALESCE($2, notes)
       WHERE id = (
         SELECT id FROM timeclock_entries
         WHERE employee_id = $1 AND clock_out IS NULL
         ORDER BY clock_in DESC LIMIT 1
       )
       RETURNING *`,
      [targetEmployeeId, notes],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No active clock-in found" },
        { status: 404 },
      );
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return toError(error);
  }
}

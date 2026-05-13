import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema";
import { Role } from "@/lib/auth";
import {
  canManageUser,
  HttpError,
  getSession,
  requireRole,
} from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireEmail,
  requireEnum,
  requireRoleValue,
  requireString,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

const EMPLOYEE_COLUMNS = `id, name, role, department, status, email, phone, avatar_url, hire_date, created_at, last_login_at`;

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
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
  console.error("[employees.[id]]", error);
  const message = error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const employeeId = parseId(params.id);
    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee id" },
        { status: 400 },
      );
    }

    const rows = await query(
      `SELECT ${EMPLOYEE_COLUMNS} FROM employees WHERE id = $1`,
      [employeeId],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return toError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    const session = requireRole(["Admin", "Leadership"]);

    const employeeId = parseId(params.id);
    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee id" },
        { status: 400 },
      );
    }

    const targetRows = await query<{ id: number; role: string | null }>(
      `SELECT id, role FROM employees WHERE id = $1 LIMIT 1`,
      [employeeId],
    );
    if (targetRows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }
    if (!canManageUser(session, targetRows[0])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if ("name" in body && body.name !== undefined) {
      const name = requireString(body.name, "name", 200);
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if ("email" in body && body.email !== undefined) {
      const email = requireEmail(body.email);
      const existing = await query(
        `SELECT id FROM employees WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1`,
        [email, employeeId],
      );
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Another employee already uses that email" },
          { status: 409 },
        );
      }
      updates.push(`email = $${idx++}`);
      values.push(email);
    }
    if ("role" in body && body.role !== undefined) {
      const role: Role = requireRoleValue(body.role);
      // Only Leadership can elevate someone to Leadership.
      if (role === "Leadership" && session.role !== "Leadership") {
        return NextResponse.json(
          { error: "Only Leadership can assign the Leadership role" },
          { status: 403 },
        );
      }
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if ("department" in body && body.department !== undefined) {
      updates.push(`department = $${idx++}`);
      values.push(optionalString(body.department, "department", 200));
    }
    if ("phone" in body && body.phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      values.push(optionalString(body.phone, "phone", 50));
    }
    if ("status" in body && body.status !== undefined) {
      const status = requireEnum(
        body.status,
        ["active", "inactive"] as const,
        "status",
      );
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (
      "password" in body &&
      body.password !== undefined &&
      body.password !== ""
    ) {
      return NextResponse.json(
        {
          error:
            "Passwords are managed in Zitadel. Do not set a local password in Diversified OS.",
        },
        { status: 400 },
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }

    values.push(employeeId);
    const rows = await query(
      `UPDATE employees SET ${updates.join(", ")} WHERE id = $${idx}
       RETURNING ${EMPLOYEE_COLUMNS}`,
      values,
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return toError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    // Destructive: only Leadership can delete/deactivate.
    const session = requireRole(["Leadership"]);
    const employeeId = parseId(params.id);
    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee id" },
        { status: 400 },
      );
    }
    if (employeeId === session.userId) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }

    // Soft-delete: mark inactive instead of hard delete to preserve history.
    const rows = await query(
      `UPDATE employees SET status = 'inactive' WHERE id = $1
       RETURNING ${EMPLOYEE_COLUMNS}`,
      [employeeId],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return toError(error);
  }
}

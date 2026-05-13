import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { hashPassword, Role } from "@/lib/auth";
import { HttpError, getSession, requireRole } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  parsePassword,
  requireEmail,
  requireRoleValue,
  requireString,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmployeeRow = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  hire_date: string | null;
  created_at: string;
  last_login_at: string | null;
};

const EMPLOYEE_COLUMNS = `id, name, role, department, status, email, phone, avatar_url, hire_date, created_at, last_login_at`;

export async function GET() {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    await ensureSchema();
    const rows = await query<EmployeeRow>(
      `SELECT ${EMPLOYEE_COLUMNS} FROM employees ORDER BY name ASC`,
    );
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[employees.GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to load employees";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    requireRole(["Admin", "Leadership"]);

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

    const name = requireString(body.name, "name", 200);
    const role: Role = requireRoleValue(body.role);
    const email = requireEmail(body.email);
    const department = optionalString(body.department, "department", 200);
    const phone = optionalString(body.phone, "phone", 50);
    const password = body.password ? parsePassword(body.password) : null;
    const status =
      optionalString(body.status, "status", 50) === "inactive"
        ? "inactive"
        : "active";

    const existing = await query(
      `SELECT id FROM employees WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An employee with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = password ? hashPassword(password) : null;

    const rows = await query<EmployeeRow>(
      `INSERT INTO employees
        (name, role, department, status, email, phone, password_hash, hire_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       RETURNING ${EMPLOYEE_COLUMNS}`,
      [name, role, department, status, email, phone, passwordHash],
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
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
    console.error("[employees.POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import {
  ROLES,
  Role,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  signSession,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmployeeRow = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  status: string | null;
  password_hash: string | null;
};

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
    } | null;

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const rows = await query<EmployeeRow>(
      `SELECT id, name, email, role, status, password_hash
       FROM employees
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email],
    );

    const user = rows[0];
    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (user.status && user.status !== "active") {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 },
      );
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const role: Role = ROLES.includes(user.role as Role)
      ? (user.role as Role)
      : "Employee";

    const { token, expiresAt } = signSession({
      userId: user.id,
      email: user.email ?? email,
      name: user.name,
      role,
    });

    await query(`UPDATE employees SET last_login_at = NOW() WHERE id = $1`, [
      user.id,
    ]);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error("[auth.login]", error);
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

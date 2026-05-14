import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  ROLES,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  type Role,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { sanitizeNextPath } from "@/lib/oidc";
import { ensureSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmployeeAuthRow = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  status: string | null;
  password_hash: string | null;
};

function loginErrorRedirect(
  request: NextRequest,
  nextPath: string,
  message: string,
) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);
  if (nextPath && nextPath !== "/dashboard") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

async function parseCredentials(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
      next?: unknown;
    } | null;

    return {
      email:
        typeof body?.email === "string" ? body.email.trim().toLowerCase() : "",
      password: typeof body?.password === "string" ? body.password : "",
      nextPath: sanitizeNextPath(
        typeof body?.next === "string" ? body.next : null,
      ),
    };
  }

  const form = await request.formData();
  return {
    email: String(form.get("email") || "")
      .trim()
      .toLowerCase(),
    password: String(form.get("password") || ""),
    nextPath: sanitizeNextPath(String(form.get("next") || "")),
  };
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    const { email, password, nextPath } = await parseCredentials(request);

    if (!email || !password) {
      return loginErrorRedirect(
        request,
        nextPath,
        "Email and password are required.",
      );
    }

    const rows = await query<EmployeeAuthRow>(
      `SELECT id, name, email, role, status, password_hash
       FROM employees
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email],
    );

    const user = rows[0];
    const invalid =
      !user ||
      user.status !== "active" ||
      !user.password_hash ||
      !verifyPassword(password, user.password_hash);

    if (invalid) {
      return loginErrorRedirect(
        request,
        nextPath,
        "Invalid email or password.",
      );
    }

    const role: Role = ROLES.includes(user.role as Role)
      ? (user.role as Role)
      : "Employee";

    const { token, expiresAt } = signSession({
      userId: user.id,
      email: user.email || email,
      name: user.name,
      role,
      provider: "local",
    });

    await query(`UPDATE employees SET last_login_at = NOW() WHERE id = $1`, [
      user.id,
    ]);

    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in right now.";
    return loginErrorRedirect(request, "/dashboard", message);
  }
}

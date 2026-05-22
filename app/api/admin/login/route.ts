import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import {
  adminPortalCookie,
  getAdminPortalAccess,
  signAdminPortalSession,
} from "@/lib/admin-portal-session";
import { verifyPassword } from "@/lib/auth";
import { verifyOidcToken } from "@/lib/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserAuthRow = {
  id: number;
  auth_provider: string | null;
  password_hash: string | null;
};

export async function POST(request: NextRequest) {
  const access = getAdminPortalAccess();

  if (!access.session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  if (access.reason === "ROLE_FORBIDDEN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
    oidcToken?: unknown;
  } | null;

  const password = typeof body?.password === "string" ? body.password : "";
  const oidcToken = typeof body?.oidcToken === "string" ? body.oidcToken : "";

  const rows = await query<UserAuthRow>(
    `SELECT id, auth_provider, password_hash FROM employees WHERE id = $1 LIMIT 1`,
    [access.session.userId],
  );

  const user = rows[0];
  if (!user) {
    return NextResponse.json(
      { error: "Current user record not found" },
      { status: 404 },
    );
  }

  const provider = user.auth_provider || "local";
  if (provider !== "local") {
    if (!oidcToken) {
      return NextResponse.json(
        { error: "OIDC token is required for re-authentication" },
        { status: 400 },
      );
    }

    const isValid = await verifyOidcToken(oidcToken, user.id);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid OIDC token" },
        { status: 401 },
      );
    }
  } else {
    if (
      !password ||
      !user.password_hash ||
      !verifyPassword(password, user.password_hash)
    ) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  }

  const role = access.session.role;
  if (role !== "Admin" && role !== "Leadership") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const signed = signAdminPortalSession({
    userId: access.session.userId,
    role,
  });

  const cookie = adminPortalCookie(signed.token, signed.expiresAt);

  await createAuditLog({
    actorUserId: access.session.userId,
    action: "admin.login",
    module: "admin",
    entityType: "session",
    entityId: signed.token,
    afterData: { provider },
    request,
  });

  return NextResponse.json(
    { message: "Re-authentication successful" },
    {
      status: 200,
      headers: {
        "Set-Cookie": `${cookie.name}=${cookie.value}; Path=${cookie.options.path}; HttpOnly; SameSite=${cookie.options.sameSite}; Secure=${cookie.options.secure}; Max-Age=${cookie.options.maxAge}; Expires=${cookie.options.expires.toUTCString()}`,
      },
    },
  );
}

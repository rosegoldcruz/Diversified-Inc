import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { hashPassword, verifyPassword, type SessionPayload } from "@/lib/auth";
import { parsePassword } from "@/lib/validators";
import { HttpError, requireUser } from "@/lib/session";
import {
  updateSecurityPreferences,
  type SecuritySettings,
} from "@/lib/user-settings";

type UserRow = {
  id: number;
  auth_provider: string | null;
  password_hash: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function changePassword(
  session: SessionPayload,
  body: Record<string, unknown>,
) {
  const rows = await query<UserRow>(
    `SELECT id, auth_provider, password_hash FROM employees WHERE id = $1 LIMIT 1`,
    [session.userId],
  );

  const user = rows[0];
  if (!user) {
    throw new Error("Current user record was not found.");
  }

  const authProvider = user.auth_provider || "local";
  if (authProvider !== "local") {
    throw new Error(
      "Password changes are managed by the authentication provider for this account.",
    );
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPasswordRaw =
    typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body.confirmNewPassword === "string" ? body.confirmNewPassword : "";

  if (!currentPassword || !newPasswordRaw || !confirmPassword) {
    throw new Error("Current password and new password are required.");
  }

  if (newPasswordRaw !== confirmPassword) {
    throw new Error("New password and confirmation do not match.");
  }

  const parsedPassword = parsePassword(newPasswordRaw, "newPassword");

  if (
    !user.password_hash ||
    !verifyPassword(currentPassword, user.password_hash)
  ) {
    throw new Error("Current password is incorrect.");
  }

  await query(`UPDATE employees SET password_hash = $1 WHERE id = $2`, [
    hashPassword(parsedPassword),
    session.userId,
  ]);
}

export async function PATCH(request: NextRequest) {
  try {
    const session = requireUser();
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

    const wantsPasswordChange =
      "currentPassword" in body ||
      "newPassword" in body ||
      "confirmNewPassword" in body;

    if (wantsPasswordChange) {
      await changePassword(session, body);
    }

    let security: SecuritySettings | null = null;
    if (body.security && typeof body.security === "object") {
      security = await updateSecurityPreferences(
        session.userId,
        body.security as Partial<SecuritySettings>,
      );
    }

    await createAuditLog({
      actorUserId: session.userId,
      action: wantsPasswordChange
        ? "settings.security.password_updated"
        : "settings.security.updated",
      module: "settings",
      entityType: "user",
      entityId: String(session.userId),
      afterData: security || { passwordUpdated: wantsPasswordChange },
      request,
    });

    return NextResponse.json({
      security,
      passwordUpdated: wantsPasswordChange,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update security settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

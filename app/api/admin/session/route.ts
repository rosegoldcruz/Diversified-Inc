import { NextResponse } from "next/server";
import { getAdminPortalAccess } from "@/lib/admin-portal-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = getAdminPortalAccess();
  if (!access.session) {
    return NextResponse.json(
      { ok: false, reason: "Authentication required" },
      { status: 401 },
    );
  }

  if (!access.allowed) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          access.reason === "ROLE_FORBIDDEN"
            ? "Admin role required"
            : "Admin re-authentication required",
      },
      { status: access.reason === "ROLE_FORBIDDEN" ? 403 : 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: access.session.userId,
      name: access.session.name,
      role: access.session.role,
      email: access.session.email,
    },
  });
}

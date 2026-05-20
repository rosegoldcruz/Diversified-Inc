import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";
import { getAdminPortalAccess } from "@/lib/admin-portal-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAccess() {
  const access = getAdminPortalAccess();
  if (!access.session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }
  if (!access.allowed) {
    return NextResponse.json(
      {
        error:
          access.reason === "ROLE_FORBIDDEN"
            ? "Admin role required"
            : "Admin re-authentication required",
      },
      { status: access.reason === "ROLE_FORBIDDEN" ? 403 : 401 },
    );
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = checkAccess();
  if (denied) return denied;

  const limit = Number(request.nextUrl.searchParams.get("limit") || "50");
  try {
    const logs = await getAuditLogs({
      limit: Number.isFinite(limit) ? Math.max(1, Math.min(200, limit)) : 50,
      module: request.nextUrl.searchParams.get("module"),
    });
    return NextResponse.json({ logs, configured: true });
  } catch (error) {
    return NextResponse.json({
      logs: [],
      configured: false,
      error:
        error instanceof Error
          ? error.message
          : "Audit logging is not configured.",
    });
  }
}

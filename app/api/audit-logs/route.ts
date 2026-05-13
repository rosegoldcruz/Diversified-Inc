import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";
import { HttpError, requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireRole(["Admin", "Leadership"]);
    const params = request.nextUrl.searchParams;
    const limitParam = Number(params.get("limit") ?? 100);
    const logs = await getAuditLogs({
      module: params.get("module"),
      action: params.get("action"),
      entityType: params.get("entity_type"),
      actorUserId: params.get("actor_user_id"),
      from: params.get("from"),
      to: params.get("to"),
      limit: Number.isInteger(limitParam) ? limitParam : 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

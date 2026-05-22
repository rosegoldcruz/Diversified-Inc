import { NextRequest, NextResponse } from "next/server";
import { disconnectMicrosoftGraphConnection } from "@/lib/microsoft-calendar";
import { HttpError, requireUser } from "@/lib/session";
import { createAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser();

    await disconnectMicrosoftGraphConnection(session.userId);

    await createAuditLog({
      actorUserId: session.userId,
      action: "microsoft_graph.disconnected",
      module: "integrations",
      entityType: "microsoft_graph_connection",
      afterData: {
        status: "disconnected",
      },
      request,
    });

    return NextResponse.json({ ok: true });
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
        : "Failed to disconnect Microsoft 365";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

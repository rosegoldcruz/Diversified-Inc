import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/session";
import { createAuditLog } from "@/lib/audit-log";
import {
  updateWorkspaceSettings,
  type WorkspaceSettings,
} from "@/lib/user-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const session = requireUser();
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!body || typeof body.workspace !== "object" || !body.workspace) {
      return NextResponse.json(
        { error: "workspace payload is required" },
        { status: 400 },
      );
    }

    const workspace = await updateWorkspaceSettings(
      session.userId,
      body.workspace as WorkspaceSettings,
    );

    await createAuditLog({
      actorUserId: session.userId,
      action: "settings.workspace.updated",
      module: "settings",
      entityType: "user",
      entityId: String(session.userId),
      afterData: {
        defaultLandingPage: workspace.defaultLandingPage,
        defaultModuleView: workspace.defaultModuleView,
        defaultDateRange: workspace.defaultDateRange,
      },
      request,
    });

    return NextResponse.json({ workspace });
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
        : "Failed to save workspace settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

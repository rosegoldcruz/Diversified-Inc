import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/session";
import { createAuditLog } from "@/lib/audit-log";
import { updateProfileSettings } from "@/lib/user-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const profile = await updateProfileSettings(session.userId, {
      displayName:
        typeof body.displayName === "string" ? body.displayName : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      department:
        typeof body.department === "string" ? body.department : undefined,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: "settings.profile.updated",
      module: "settings",
      entityType: "user",
      entityId: String(session.userId),
      afterData: profile,
      request,
    });

    return NextResponse.json({ profile });
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
        : "Failed to save profile settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/session";
import { createAuditLog } from "@/lib/audit-log";
import {
  updateAppearanceSettings,
  type AppearanceSettings,
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

    if (!body || typeof body.appearance !== "object" || !body.appearance) {
      return NextResponse.json(
        { error: "appearance payload is required" },
        { status: 400 },
      );
    }

    const appearance = await updateAppearanceSettings(
      session.userId,
      body.appearance as AppearanceSettings,
    );

    await createAuditLog({
      actorUserId: session.userId,
      action: "settings.appearance.updated",
      module: "settings",
      entityType: "user",
      entityId: String(session.userId),
      afterData: {
        theme: appearance.theme,
        density: appearance.density,
        reduceMotion: appearance.reduceMotion,
      },
      request,
    });

    return NextResponse.json({ appearance });
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
        : "Failed to save appearance settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

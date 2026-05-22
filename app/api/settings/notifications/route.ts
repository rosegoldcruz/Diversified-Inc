import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/session";
import { createAuditLog } from "@/lib/audit-log";
import {
  updateNotificationsSettings,
  type NotificationSettings,
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

    if (
      !body ||
      typeof body.notifications !== "object" ||
      !body.notifications
    ) {
      return NextResponse.json(
        { error: "notifications payload is required" },
        { status: 400 },
      );
    }

    const notifications = await updateNotificationsSettings(
      session.userId,
      body.notifications as NotificationSettings,
    );

    await createAuditLog({
      actorUserId: session.userId,
      action: "settings.notifications.updated",
      module: "settings",
      entityType: "user",
      entityId: String(session.userId),
      afterData: {
        digestFrequency: notifications.digestFrequency,
        quietHoursEnabled: notifications.quietHoursEnabled,
        toastStyle: notifications.toastStyle,
      },
      request,
    });

    return NextResponse.json({ notifications });
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
        : "Failed to save notification settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

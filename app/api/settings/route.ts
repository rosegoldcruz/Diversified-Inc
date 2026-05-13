import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit-log";
import {
  isAllowedCategory,
  isAllowedSettingKey,
  isValidSettingValue,
  type SettingCategory,
  type SettingKey,
  type SystemSettingValue,
} from "@/lib/settings-config";
import {
  appendAuditLog,
  getAllSettings,
  upsertSetting,
} from "@/lib/settings-store";
import { HttpError, requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type SettingsPatchBody = {
  key?: unknown;
  value?: unknown;
  category?: unknown;
  description?: unknown;
};

export async function GET() {
  try {
    requireRole(["Admin", "Leadership"]);
    const { rows, byKey } = await getAllSettings();

    return NextResponse.json({
      settings: rows,
      byKey,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = requireRole(["Admin", "Leadership"]);
    const body = (await request.json()) as SettingsPatchBody;

    if (!isAllowedSettingKey(body.key)) {
      return NextResponse.json(
        { error: "Invalid setting key" },
        { status: 400 },
      );
    }

    if (!isValidSettingValue(body.key, body.value)) {
      return NextResponse.json(
        { error: "Invalid setting value" },
        { status: 400 },
      );
    }

    let category: SettingCategory | undefined;
    if (body.category !== undefined) {
      if (!isAllowedCategory(body.category)) {
        return NextResponse.json(
          { error: "Invalid setting category" },
          { status: 400 },
        );
      }
      category = body.category;
    }

    const description =
      typeof body.description === "string" ? body.description : undefined;

    const updated = await upsertSetting({
      key: body.key as SettingKey,
      value: body.value as SystemSettingValue,
      category,
      description,
    });

    await appendAuditLog({
      action: "setting.updated",
      module: "settings",
      recordId: updated.key,
      metadata: {
        key: updated.key,
        category: updated.category,
        actorUserId: session.userId,
      },
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: "setting.updated",
      module: "settings",
      entityType: "system_setting",
      entityId: updated.key,
      afterData: updated,
      request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update setting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  createAutomationEvent,
  getRecentAutomationEvents,
} from "@/lib/automation-events";
import { HttpError, requireRole } from "@/lib/session";
import {
  optionalString,
  requireString,
  ValidationError,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireRole(["Manager", "Admin", "Leadership"]);
    const params = request.nextUrl.searchParams;
    const limitParam = Number(params.get("limit") ?? 50);
    const events = await getRecentAutomationEvents({
      status: params.get("status"),
      eventType: params.get("event_type"),
      sourceModule: params.get("source_module"),
      limit: Number.isInteger(limitParam) ? limitParam : 50,
    });

    return NextResponse.json({ events });
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
        : "Failed to load automation events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireRole(["Admin", "Leadership"]);
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

    const event = await createAutomationEvent({
      eventType: requireString(body.event_type, "event_type", 120),
      sourceModule: requireString(body.source_module, "source_module", 120),
      entityType: optionalString(body.entity_type, "entity_type", 120),
      entityId:
        typeof body.entity_id === "string" || typeof body.entity_id === "number"
          ? body.entity_id
          : null,
      actorUserId: session.userId,
      path: optionalString(body.path, "path", 500) ?? "/automations",
      payload:
        body.payload &&
        typeof body.payload === "object" &&
        !Array.isArray(body.payload)
          ? (body.payload as Record<string, unknown>)
          : {},
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create automation event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

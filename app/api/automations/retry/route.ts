import { NextRequest, NextResponse } from "next/server";
import { dispatchAutomationEvent } from "@/lib/automation-events";
import { HttpError, requireRole } from "@/lib/session";
import { requireString, ValidationError } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireRole(["Admin", "Leadership"]);
    const body = (await request.json().catch(() => null)) as {
      event_id?: unknown;
    } | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const eventId = requireString(body.event_id, "event_id", 80);
    const response = await dispatchAutomationEvent(eventId);
    return NextResponse.json({ ok: true, response });
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
        : "Failed to retry automation event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

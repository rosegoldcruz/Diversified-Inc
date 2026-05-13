import { NextResponse } from "next/server";
import { getAutomationStatus } from "@/lib/automation-events";
import { HttpError, requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireRole(["Manager", "Admin", "Leadership"]);
    const status = await getAutomationStatus();
    return NextResponse.json(status);
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
        : "Failed to load automation status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

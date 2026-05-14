import { NextResponse } from "next/server";
import { getMicrosoftIntegrationStatusForUser } from "@/lib/microsoft-calendar";
import { HttpError, requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = requireUser();
    const status = await getMicrosoftIntegrationStatusForUser(session.userId);

    return NextResponse.json({
      provider: "microsoft_365",
      ...status,
      checkedAt: new Date().toISOString(),
    });
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
        : "Failed to load Microsoft status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

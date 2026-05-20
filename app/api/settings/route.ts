import { NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/session";
import { getUserSettings } from "@/lib/user-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = requireUser();
    const settings = await getUserSettings(session.userId);
    return NextResponse.json(settings);
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

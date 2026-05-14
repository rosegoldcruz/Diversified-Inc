import { NextRequest, NextResponse } from "next/server";
import {
  parseDateRange,
  syncOutlookCalendarForUser,
} from "@/lib/microsoft-calendar";
import { HttpError, requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser();

    const body = (await request.json().catch(() => null)) as {
      from?: string;
      to?: string;
    } | null;

    const { from, to } = parseDateRange(body?.from ?? null, body?.to ?? null);

    const synced = await syncOutlookCalendarForUser({
      userId: session.userId,
      from,
      to,
    });

    return NextResponse.json({
      ok: true,
      provider: "microsoft_365",
      synced,
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
        : "Failed to sync Outlook calendar";
    const status = message.toLowerCase().includes("not connected") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

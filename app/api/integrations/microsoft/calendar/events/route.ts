import { NextRequest, NextResponse } from "next/server";
import {
  getCachedOutlookEvents,
  parseDateRange,
} from "@/lib/microsoft-calendar";
import { HttpError, requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser();

    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    const { from: fromDate, to: toDate } = parseDateRange(from, to);

    const events = await getCachedOutlookEvents({
      userId: session.userId,
      from: fromDate,
      to: toDate,
    });

    return NextResponse.json({
      events,
      range: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
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
        : "Failed to fetch calendar events";

    if (message.toLowerCase().includes("not connected")) {
      return NextResponse.json(
        { error: "Microsoft 365 is not connected" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

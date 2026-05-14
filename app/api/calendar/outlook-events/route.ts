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
    const params = request.nextUrl.searchParams;
    const { from, to } = parseDateRange(params.get("from"), params.get("to"));

    const events = await getCachedOutlookEvents({
      userId: session.userId,
      from,
      to,
    });

    return NextResponse.json({
      provider: "microsoft_365",
      from: from.toISOString(),
      to: to.toISOString(),
      events: events.map((event) => ({
        id: event.id,
        outlook_event_id: event.outlook_event_id,
        title: event.subject || "(No Subject)",
        subject: event.subject,
        body_preview: event.body_preview,
        organizer_name: event.organizer_name,
        organizer_email: event.organizer_email,
        location: event.location,
        web_link: event.web_link,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day,
        response_status: event.response_status,
        source: "outlook",
        read_only: true,
      })),
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
        : "Failed to load cached Outlook events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

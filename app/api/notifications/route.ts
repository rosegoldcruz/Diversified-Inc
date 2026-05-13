import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import {
  HttpError,
  getSession,
  requireUser,
  unauthorized,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationRow = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) return unauthorized();

    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "25");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.trunc(limitParam), 1), 100)
      : 25;
    const unreadOnly = url.searchParams.get("unread") === "1";

    const rows = await query<NotificationRow>(
      `SELECT id, user_id, type, title, body, link, read_at, created_at
       FROM notifications
       WHERE user_id = $1
         ${unreadOnly ? "AND read_at IS NULL" : ""}
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      [session.userId],
    );

    const unreadCountRow = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [session.userId],
    );
    const unreadCount = Number(unreadCountRow[0]?.count ?? "0");

    return NextResponse.json({ notifications: rows, unreadCount });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/notifications  → mark all current-user notifications read. */
export async function POST() {
  try {
    await ensureSchema();
    const session = requireUser();

    await query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`,
      [session.userId],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

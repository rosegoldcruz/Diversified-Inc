import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const rows = await query<{ id: number }>(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING id`,
      [id, session.userId],
    );
    if (rows.length === 0) {
      // Either not found, not yours, or already read — treat as idempotent success.
      return NextResponse.json({ ok: true, changed: false });
    }
    return NextResponse.json({ ok: true, changed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

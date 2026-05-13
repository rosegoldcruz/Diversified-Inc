import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { HttpError, getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json({ error: "Invalid form id" }, { status: 400 });
    }

    const rows = await query(
      `SELECT
         f.id, f.title, f.type, f.submitted_by, f.status,
         f.form_data, f.submitted_at, f.reviewed_at, f.created_at,
         e.name AS submitted_by_name,
         (
           SELECT json_build_object('id', r.id, 'request_id', r.request_id, 'status', r.status)
           FROM requests r
           WHERE r.linked_form_id = f.id::text
           ORDER BY r.id DESC
           LIMIT 1
         ) AS linked_request
       FROM forms f
       LEFT JOIN employees e ON e.id = f.submitted_by
       WHERE f.id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[forms.id.GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to load form";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

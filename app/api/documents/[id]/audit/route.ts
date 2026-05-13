import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HttpError, requireUser } from "@/lib/session";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const documentId = parseId(params.id);
  if (!documentId) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  try {
    requireUser();
    const rows = await query(
      `SELECT l.id, l.action, e.name AS performed_by_name, l.details, l.created_at
       FROM document_audit_logs l
       LEFT JOIN employees e ON e.id = l.performed_by
       WHERE l.document_id = $1
       ORDER BY l.created_at DESC, l.id DESC`,
      [documentId],
    );
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

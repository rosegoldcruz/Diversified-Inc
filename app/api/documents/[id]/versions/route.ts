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
      `SELECT id, document_id, version_number, file_url, changes_description, created_at
       FROM document_versions
       WHERE document_id = $1
       ORDER BY version_number DESC, id DESC`,
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
      error instanceof Error ? error.message : "Failed to load versions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

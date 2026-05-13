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
      `SELECT
         id, document_type, entity_type, entity_id, title, file_path, file_url,
         storage_url, file_size, mime_type, status, sign_status, generated_by,
         signed_by, signed_at, signature_data, metadata, generated_at,
         created_at, updated_at
       FROM documents
       WHERE id = $1
       LIMIT 1`,
      [documentId],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

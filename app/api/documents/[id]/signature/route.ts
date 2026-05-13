import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { HttpError, requireRole } from "@/lib/session";
import { ValidationError, requireEnum } from "@/lib/validators";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGN_STATUSES = [
  "unsigned",
  "pending_signature",
  "partially_signed",
  "signed",
  "declined",
  "expired",
] as const;

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const documentId = parseId(params.id);
  if (!documentId) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body) {
      return NextResponse.json(
        { error: "JSON body required" },
        { status: 400 },
      );
    }

    const signStatus = requireEnum(
      typeof body.sign_status === "string"
        ? body.sign_status.trim().toLowerCase()
        : body.sign_status,
      SIGN_STATUSES,
      "sign_status",
    );

    const rows = await query(
      `UPDATE documents
       SET sign_status = $1,
           signed_by = CASE WHEN $1 = 'signed' THEN $2 ELSE signed_by END,
           signed_at = CASE WHEN $1 = 'signed' THEN NOW() ELSE signed_at END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [signStatus, session.userId, documentId],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    await createNotification({
      type: "document.signature_updated",
      title: `Document signature ${signStatus.replaceAll("_", " ")}`,
      body: `${session.name} updated document #${documentId}.`,
      link: `/documents/${documentId}`,
      audienceRoles: ["Manager", "Admin", "Leadership"],
      excludeUserId: session.userId,
    });

    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update signature";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

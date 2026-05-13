import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notifications";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireEnum,
  requireString,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCUMENT_STATUSES = [
  "draft",
  "generated",
  "sent",
  "viewed",
  "archived",
  "cancelled",
] as const;
const SIGN_STATUSES = [
  "unsigned",
  "pending_signature",
  "partially_signed",
  "signed",
  "declined",
  "expired",
] as const;

export async function GET(request: NextRequest) {
  try {
    requireUser();
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || 100);
    const limit = Number.isInteger(limitParam)
      ? Math.min(Math.max(limitParam, 1), 500)
      : 100;

    const rows = await query(
      `SELECT
         id, document_type, entity_type, entity_id, title, file_path, file_url,
         storage_url, file_size, mime_type, status, sign_status, generated_by,
         signed_by, signed_at, signature_data, metadata, generated_at,
         created_at, updated_at
       FROM documents
       ORDER BY created_at DESC, id DESC
       LIMIT $1`,
      [limit],
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
      error instanceof Error ? error.message : "Failed to load documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const title = requireString(body.title, "title", 250);
    const documentType =
      optionalString(body.document_type, "document_type", 100) ?? "document";
    const status = body.status
      ? requireEnum(normalizeText(body.status), DOCUMENT_STATUSES, "status")
      : "draft";
    const signStatus = body.sign_status
      ? requireEnum(
          normalizeText(body.sign_status),
          SIGN_STATUSES,
          "sign_status",
        )
      : "unsigned";
    const entityType = optionalString(body.entity_type, "entity_type", 100);
    const entityId = optionalInteger(body.entity_id, "entity_id");
    const fileUrl = optionalString(body.file_url, "file_url", 1000);
    const storageUrl = optionalString(body.storage_url, "storage_url", 1000);
    const mimeType =
      optionalString(body.mime_type, "mime_type", 200) ?? "application/pdf";
    const fileSize = optionalInteger(body.file_size, "file_size");

    const rows = await query(
      `INSERT INTO documents
        (document_type, entity_type, entity_id, title, file_url, storage_url,
         file_size, mime_type, status, sign_status, generated_by, generated_at,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW())
       RETURNING *`,
      [
        documentType,
        entityType,
        entityId,
        title,
        fileUrl,
        storageUrl,
        fileSize,
        mimeType,
        status,
        signStatus,
        session.userId,
      ],
    );

    await createNotification({
      type: "document.created",
      title: `New document: ${title}`,
      body: `${session.name} added a document record.`,
      link: `/documents/${rows[0].id}`,
      audienceRoles: ["Manager", "Admin", "Leadership"],
      excludeUserId: session.userId,
    });

    await createAuditLog({
      actorUserId: session.userId,
      action: "document.created",
      module: "documents",
      entityType: "document",
      entityId: rows[0].id,
      afterData: rows[0],
      request,
    });

    return NextResponse.json(rows[0], { status: 201 });
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
      error instanceof Error ? error.message : "Failed to create document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : String(value);
}

function optionalInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError(`${label} must be a non-negative integer`);
  }
  return parsed;
}

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { HttpError, requireUser } from "@/lib/session";
import { ValidationError } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

const LINKED_ENTITY_TYPES = new Set([
  "task",
  "request",
  "work_order",
  "sop",
  "inventory",
  "employee",
  "document",
]);

export async function GET() {
  try {
    const rows = await listFiles();
    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "file must not be empty" },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "file must be 25 MB or smaller" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}` },
        { status: 400 },
      );
    }

    const category = normalizeText(formData.get("category"), "document", 80);
    const linkedEntityType = normalizeOptionalText(
      formData.get("linked_entity_type"),
      80,
    );
    const linkedEntityId = normalizeOptionalInteger(
      formData.get("linked_entity_id"),
      "linked_entity_id",
    );

    if (linkedEntityType && !LINKED_ENTITY_TYPES.has(linkedEntityType)) {
      return NextResponse.json(
        { error: "linked_entity_type is not supported" },
        { status: 400 },
      );
    }

    if (
      (linkedEntityType && !linkedEntityId) ||
      (!linkedEntityType && linkedEntityId)
    ) {
      return NextResponse.json(
        {
          error:
            "linked_entity_type and linked_entity_id must be provided together",
        },
        { status: 400 },
      );
    }

    const safeOriginalName = sanitizeOriginalFilename(file.name);
    const extension = path.extname(safeOriginalName).toLowerCase();
    const storedName = `${randomUUID()}${extension}`;
    const storageRoot = getStorageRoot();
    await mkdir(storageRoot, { recursive: true });

    const storagePath = path.join(storageRoot, storedName);
    assertInsideStorage(storageRoot, storagePath);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(storagePath, buffer, { flag: "wx" });

    const rows = await query<{ id: number }>(
      `INSERT INTO file_records
        (name, original_name, stored_name, storage_path, category, mime_type,
         size_bytes, uploaded_by, uploaded_by_user_id, uploaded_at, created_at,
         linked_entity_type, linked_entity_id, url)
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $10, $11)
       RETURNING id`,
      [
        safeOriginalName,
        storedName,
        storagePath,
        category,
        file.type,
        file.size,
        session.name,
        session.userId,
        linkedEntityType,
        linkedEntityId,
        `/api/files/${storedName}`,
      ],
    );

    const created = await getFileById(rows[0].id);
    await safeCreateAutomationEvent({
      eventType: "file_uploaded",
      sourceModule: "files",
      entityType: "file",
      entityId: rows[0].id,
      actorUserId: session.userId,
      path: "/files",
      payload: {
        file_id: rows[0].id,
        original_name: safeOriginalName,
        category,
        mime_type: file.type,
        size_bytes: file.size,
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId,
      },
    });
    await createAuditLog({
      actorUserId: session.userId,
      action: "file.uploaded",
      module: "files",
      entityType: "file",
      entityId: rows[0].id,
      afterData: created ?? rows[0],
      request,
    });
    return NextResponse.json(created ?? rows[0], { status: 201 });
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
    console.error("[files.POST]", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function listFiles() {
  return query(`
    SELECT
      id,
      'F-' || LPAD(id::text, 3, '0') AS file_id,
      COALESCE(original_name, name) AS file_name,
      category AS file_type,
      COALESCE(
        CASE
          WHEN linked_entity_type IS NOT NULL AND linked_entity_id IS NOT NULL
            THEN linked_entity_type || ':' || linked_entity_id::text
          ELSE NULL
        END,
        linked_work_order_id::text,
        linked_request_id::text,
        linked_task_id::text,
        linked_sop_id::text
      ) AS linked_job,
      CASE
        WHEN size_bytes IS NULL THEN NULL
        WHEN size_bytes >= 1048576 THEN ROUND((size_bytes::numeric / 1048576), 1)::text || ' MB'
        WHEN size_bytes >= 1024 THEN ROUND((size_bytes::numeric / 1024), 0)::text || ' KB'
        ELSE size_bytes::text || ' B'
      END AS file_size,
      size_bytes,
      mime_type,
      uploaded_by,
      uploaded_at,
      created_at,
      linked_entity_type,
      linked_entity_id,
      '/api/files/' || id || '/download' AS download_url
    FROM file_records
    ORDER BY COALESCE(created_at, uploaded_at) DESC, id DESC
  `);
}

export async function getFileById(fileId: number) {
  const rows = await query(
    `SELECT
      id,
      'F-' || LPAD(id::text, 3, '0') AS file_id,
      COALESCE(original_name, name) AS file_name,
      stored_name,
      storage_path,
      category AS file_type,
      mime_type,
      size_bytes,
      uploaded_by,
      uploaded_by_user_id,
      uploaded_at,
      created_at,
      linked_entity_type,
      linked_entity_id,
      '/api/files/' || id || '/download' AS download_url
     FROM file_records
     WHERE id = $1
     LIMIT 1`,
    [fileId],
  );

  return rows[0] ?? null;
}

export function getStorageRoot() {
  return path.resolve(
    process.env.FILE_STORAGE_DIR ||
      path.join(process.cwd(), "storage", "uploads"),
  );
}

export function assertInsideStorage(storageRoot: string, targetPath: string) {
  const root = path.resolve(storageRoot);
  const target = path.resolve(targetPath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("Unsafe file path");
  }
}

function sanitizeOriginalFilename(value: string) {
  const base = path.basename(value || "upload");
  const sanitized = base
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return sanitized.length > 0 ? sanitized.slice(0, 180) : "upload";
}

function normalizeText(
  value: FormDataEntryValue | null,
  fallback: string,
  max: number,
) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed.slice(0, max) : fallback;
}

function normalizeOptionalText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed.slice(0, max) : null;
}

function normalizeOptionalInteger(
  value: FormDataEntryValue | null,
  label: string,
) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${label} must be an integer`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer`);
  }
  return parsed;
}

import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  assertInsideStorage,
  getFileById,
  getStorageRoot,
} from "@/app/api/files/route";
import { createAuditLog } from "@/lib/audit-log";
import { HttpError, requireUser } from "@/lib/session";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const fileId = parseId(params.id);
  if (!fileId) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  try {
    const session = requireUser();
    const file = (await getFileById(fileId)) as {
      file_name: string;
      storage_path: string | null;
      mime_type: string | null;
      size_bytes: number | null;
    } | null;

    if (!file || !file.storage_path) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const storageRoot = getStorageRoot();
    const resolvedPath = path.resolve(file.storage_path);
    assertInsideStorage(storageRoot, resolvedPath);

    const info = await stat(resolvedPath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const data = await readFile(resolvedPath);
    const filename = encodeURIComponent(file.file_name || `file-${fileId}`);

    await createAuditLog({
      actorUserId: session.userId,
      action: "file.downloaded",
      module: "files",
      entityType: "file",
      entityId: fileId,
      afterData: {
        file_id: fileId,
        file_name: file.file_name,
        mime_type: file.mime_type,
        size_bytes: info.size,
      },
      request,
    });

    return new NextResponse(data, {
      headers: {
        "Content-Type": file.mime_type || "application/octet-stream",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to download file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getFileById } from "@/app/api/files/route";
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
  const fileId = parseId(params.id);
  if (!fileId) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  try {
    requireUser();
    const file = await getFileById(fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(file);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

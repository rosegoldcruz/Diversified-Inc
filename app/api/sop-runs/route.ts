import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import { ValidationError, optionalEnum } from "@/lib/validators";
import {
  SOP_RUN_STATUSES,
  listSopRuns,
  parseJsonObject,
  parseOptionalPositiveInteger,
  parsePositiveInteger,
  startSopRun,
} from "@/lib/sop-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireUser();
    const status = optionalEnum(
      request.nextUrl.searchParams.get("status"),
      SOP_RUN_STATUSES,
      "status",
    );
    const assignedTo = parseOptionalPositiveInteger(
      request.nextUrl.searchParams.get("assigned_to"),
      "assigned_to",
    );
    const limit = request.nextUrl.searchParams.get("limit")
      ? parsePositiveInteger(request.nextUrl.searchParams.get("limit"), "limit")
      : 100;

    const runs = await listSopRuns({ status, assignedTo, limit });
    return NextResponse.json(runs);
  } catch (error) {
    return handleSopError(error, "Failed to load SOP runs");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireRole(["Employee", "Manager", "Admin", "Leadership"]);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "JSON body required" }, { status: 400 });
    }

    const sopId = parsePositiveInteger(body.sop_id ?? body.sopId, "sop_id");
    const assignedTo = parseOptionalPositiveInteger(
      body.assigned_to ?? body.assignedTo,
      "assigned_to",
    );
    const stateJson = parseJsonObject(body.state_json ?? body.stateJson, "state_json") ?? {};

    const run = await startSopRun({
      sopId,
      assignedTo: assignedTo ?? session.userId,
      startedBy: session.userId,
      stateJson,
      request,
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    return handleSopError(error, "Failed to start SOP run");
  }
}

function handleSopError(error: unknown, fallback: string) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: 400 },
    );
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

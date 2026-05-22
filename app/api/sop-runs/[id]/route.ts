import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import { ValidationError, requireEnum, requireString } from "@/lib/validators";
import { blockSopRun, getSopRunDetail, resumeSopRun } from "@/lib/sop-engine";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    requireUser();
    const run = await getSopRunDetail(params.id);

    if (!run) {
      return NextResponse.json({ error: "SOP run not found" }, { status: 404 });
    }

    return NextResponse.json(run);
  } catch (error) {
    return handleSopError(error, "Failed to load SOP run");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Employee", "Manager", "Admin", "Leadership"]);
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

    const action = requireEnum(
      body.action,
      ["block", "resume"] as const,
      "action",
    );

    if (action === "block") {
      const reason = requireString(body.reason, "reason", 2000);
      const waitType =
        typeof body.wait_type === "string" ? body.wait_type : null;
      const run = await blockSopRun({
        runId: params.id,
        actorUserId: session.userId,
        reason,
        waitType,
        request,
      });
      return NextResponse.json(run);
    }

    const run = await resumeSopRun({
      runId: params.id,
      actorUserId: session.userId,
      request,
    });
    return NextResponse.json(run);
  } catch (error) {
    return handleSopError(error, "Failed to update SOP run");
  }
}

function handleSopError(error: unknown, fallback: string) {
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
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

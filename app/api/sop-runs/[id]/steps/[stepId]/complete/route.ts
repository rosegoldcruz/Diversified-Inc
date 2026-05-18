import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/session";
import { ValidationError, optionalString } from "@/lib/validators";
import { completeSopRunStep, parsePositiveInteger } from "@/lib/sop-engine";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
    stepId: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Employee", "Manager", "Admin", "Leadership"]);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const stepId = parsePositiveInteger(params.stepId, "step id");

    const run = await completeSopRunStep({
      runId: params.id,
      stepId,
      actorUserId: session.userId,
      notes: optionalString(body.notes, "notes", 5000),
      evidenceUrl: optionalString(body.evidence_url ?? body.evidenceUrl, "evidence_url", 2000),
      request,
    });

    return NextResponse.json(run);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to complete SOP step";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

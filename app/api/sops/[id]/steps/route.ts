import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireInteger,
  requireString,
} from "@/lib/validators";
import {
  createSopStep,
  ensureSopEngineTables,
  getSopTemplate,
  parseBoolean,
  parseJsonObject,
  parseOptionalPositiveInteger,
  parsePositiveInteger,
} from "@/lib/sop-engine";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    requireUser();
    const sopId = parsePositiveInteger(params.id, "sop id");
    const sop = await getSopTemplate(sopId);

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    return NextResponse.json(sop.steps ?? []);
  } catch (error) {
    return handleSopError(error, "Failed to load SOP steps");
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    await ensureSopEngineTables();

    const sopId = parsePositiveInteger(params.id, "sop id");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "JSON body required" }, { status: 400 });
    }

    const title = requireString(body.title, "title", 250);
    const instructions = optionalString(body.instructions, "instructions", 8000);
    const requiredRole = optionalString(body.required_role ?? body.requiredRole, "required_role", 80);
    const estimatedMinutes = parseOptionalPositiveInteger(
      body.estimated_minutes ?? body.estimatedMinutes,
      "estimated_minutes",
    );
    const stepOrder = body.step_order === undefined ? null : requireInteger(body.step_order, "step_order", { min: 1 });
    const branchCondition = parseJsonObject(
      body.branch_condition ?? body.branchCondition,
      "branch_condition",
    );

    const step = await createSopStep({
      sopId,
      title,
      instructions,
      requiredRole,
      requiresEvidence: parseBoolean(body.requires_evidence ?? body.requiresEvidence),
      requiresApproval: parseBoolean(body.requires_approval ?? body.requiresApproval),
      estimatedMinutes,
      branchCondition,
      stepOrder,
      actorUserId: session.userId,
      request,
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    return handleSopError(error, "Failed to create SOP step");
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

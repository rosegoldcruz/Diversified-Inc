import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/session";
import { ValidationError, optionalString, requireEnum } from "@/lib/validators";
import { resolveSopApproval } from "@/lib/sop-engine";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
    approvalId: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "JSON body required" }, { status: 400 });
    }

    const decision = requireEnum(body.decision, ["approved", "rejected"] as const, "decision");
    const comment = optionalString(body.comment, "comment", 2000);

    const run = await resolveSopApproval({
      runId: params.id,
      approvalId: params.approvalId,
      actorUserId: session.userId,
      decision,
      comment,
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
    const message = error instanceof Error ? error.message : "Failed to resolve SOP approval";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

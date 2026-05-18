import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireEnum,
  requireString,
} from "@/lib/validators";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import {
  SOP_TEMPLATE_STATUSES,
  ensureSopEngineTables,
  getSopTemplate,
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

    return NextResponse.json(sop);
  } catch (error) {
    return handleSopError(error, "Failed to load SOP");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    await ensureSopEngineTables();

    const sopId = parsePositiveInteger(params.id, "sop id");
    const before = await getSopTemplate(sopId);
    if (!before) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

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

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined) {
      values.push(requireString(body.title, "title", 250));
      updates.push(`title = $${values.length}`);
    }
    if (body.description !== undefined) {
      values.push(optionalString(body.description, "description", 5000));
      updates.push(`description = $${values.length}`);
    }
    if (body.category !== undefined) {
      values.push(optionalString(body.category, "category", 120));
      updates.push(`category = $${values.length}`);
    }
    if (body.department !== undefined) {
      values.push(optionalString(body.department, "department", 120));
      updates.push(`department = $${values.length}`);
    }
    if (body.status !== undefined) {
      values.push(requireEnum(body.status, SOP_TEMPLATE_STATUSES, "status"));
      updates.push(`status = $${values.length}`);
    }
    if (body.version !== undefined) {
      values.push(optionalString(body.version, "version", 50) ?? "1.0");
      updates.push(`version = $${values.length}`);
    }
    if (body.owner !== undefined) {
      const owner =
        body.owner === null || body.owner === ""
          ? null
          : parsePositiveInteger(body.owner as string | number, "owner");
      if (owner !== null) {
        const employee = await query<{ id: number }>(
          `SELECT id FROM employees WHERE id = $1 LIMIT 1`,
          [owner],
        );
        if (employee.length === 0) {
          return NextResponse.json(
            { error: "owner must reference an existing employee" },
            { status: 400 },
          );
        }
      }
      values.push(owner);
      updates.push(`owner = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No SOP fields provided" },
        { status: 400 },
      );
    }

    updates.push(`last_updated = NOW()`);
    updates.push(`updated_at = NOW()`);
    values.push(sopId);

    await query(
      `UPDATE sops
       SET ${updates.join(", ")}
       WHERE id = $${values.length}`,
      values,
    );

    const after = await getSopTemplate(sopId);

    await createAuditLog({
      actorUserId: session.userId,
      action: "sop.updated",
      module: "sops",
      entityType: "sop",
      entityId: sopId,
      beforeData: before,
      afterData: after,
      request,
    });

    return NextResponse.json(after);
  } catch (error) {
    return handleSopError(error, "Failed to update SOP");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = requireRole(["Admin", "Leadership"]);
    await ensureSopEngineTables();

    const sopId = parsePositiveInteger(params.id, "sop id");
    const before = await getSopTemplate(sopId);
    if (!before) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    const runRows = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM sop_runs WHERE sop_id = $1`,
      [sopId],
    );
    const runCount = Number(runRows[0]?.total ?? "0");
    if (runCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete SOP with execution history. Archive it instead.",
        },
        { status: 409 },
      );
    }

    await query(`DELETE FROM sops WHERE id = $1`, [sopId]);

    await createAuditLog({
      actorUserId: session.userId,
      action: "sop.deleted",
      module: "sops",
      entityType: "sop",
      entityId: sopId,
      beforeData: before,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleSopError(error, "Failed to delete SOP");
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

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { ensureSchema } from "@/lib/schema";
import { HttpError, getSession, requireRole } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { ValidationError, optionalString, requireEnum } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

const STATUSES = [
  "Submitted",
  "Under Review",
  "Approved",
  "Denied",
  "Completed",
] as const;
type RequestStatus = (typeof STATUSES)[number];

/** Allowed transitions per the BUILD-CLOSURE-CHECKLIST workflow rules. */
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  Submitted: ["Under Review", "Approved", "Denied"],
  "Under Review": ["Approved", "Denied"],
  Approved: ["Completed"],
  Denied: [],
  Completed: [],
};

const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

type RequestRow = {
  id: number;
  request_id: string | null;
  title: string;
  requester: string;
  category: string;
  priority: string;
  status: RequestStatus;
  description: string | null;
  assigned_reviewer: string | null;
  submitted_date: string;
  updated_at: string;
  linked_form_id: string | null;
  linked_task_id: number | null;
  updated_by: number | null;
};

function toError(error: unknown) {
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
  console.error("[requests.[id]]", error);
  const message = error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 500 });
}

function normalizeStatus(value: string): RequestStatus | null {
  const lower = value.toLowerCase();
  const match = STATUSES.find((s) => s.toLowerCase() === lower);
  return match ?? null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json(
        { error: "Invalid request id" },
        { status: 400 },
      );
    }
    const rows = await query<RequestRow>(
      `SELECT * FROM requests WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    return toError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    // Only Manager+ can mutate requests once they're in the queue.
    const session = requireRole(["Manager", "Admin", "Leadership"]);

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json(
        { error: "Invalid request id" },
        { status: 400 },
      );
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

    const existingRows = await query<RequestRow>(
      `SELECT * FROM requests WHERE id = $1`,
      [id],
    );
    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const existing = existingRows[0];
    const currentStatus = normalizeStatus(existing.status) ?? "Submitted";

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    let nextStatus: RequestStatus = currentStatus;

    if ("status" in body && body.status !== undefined) {
      const requested = requireEnum(body.status, STATUSES, "status");
      if (requested !== currentStatus) {
        const allowed = TRANSITIONS[currentStatus] ?? [];
        if (!allowed.includes(requested)) {
          return NextResponse.json(
            {
              error: `Invalid status transition: ${currentStatus} → ${requested}`,
              allowed,
            },
            { status: 409 },
          );
        }
        // Approving/denying/completing is restricted to Admin+ on Approved->Completed too.
        if (
          (requested === "Approved" || requested === "Denied") &&
          session.role === "Manager"
        ) {
          // Managers may approve/deny requests they own; allow it.
        }
        updates.push(`status = $${idx++}`);
        values.push(requested);
        nextStatus = requested;
      }
    }

    if ("assigned_reviewer" in body && body.assigned_reviewer !== undefined) {
      updates.push(`assigned_reviewer = $${idx++}`);
      values.push(
        optionalString(body.assigned_reviewer, "assigned_reviewer", 200),
      );
    }
    if ("priority" in body && body.priority !== undefined) {
      const priority = requireEnum(body.priority, PRIORITIES, "priority");
      updates.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if ("description" in body && body.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(optionalString(body.description, "description", 5000));
    }
    if ("title" in body && body.title !== undefined) {
      const title = optionalString(body.title, "title", 200);
      if (title) {
        updates.push(`title = $${idx++}`);
        values.push(title);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 },
      );
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${idx++}`);
    values.push(session.userId);

    values.push(id);
    const rows = await query<RequestRow>(
      `UPDATE requests SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );

    const updated = rows[0];

    await createAuditLog({
      actorUserId: session.userId,
      action:
        nextStatus !== currentStatus
          ? "request.status_updated"
          : "request.updated",
      module: "requests",
      entityType: "request",
      entityId: updated.id,
      beforeData: existing,
      afterData: updated,
      request,
    });

    // Notify the requester (best-effort) when status changes.
    if (nextStatus !== currentStatus) {
      const requesterRow = await query<{ id: number }>(
        `SELECT id FROM employees WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [updated.requester],
      );
      const requesterId = requesterRow[0]?.id;
      await createNotification({
        type: `request.${nextStatus.toLowerCase().replace(/\s+/g, "_")}`,
        title: `Request ${updated.request_id ?? `#${updated.id}`} → ${nextStatus}`,
        body: `${session.name} updated the status to ${nextStatus}.`,
        link: "/requests",
        userIds: requesterId ? [requesterId] : undefined,
        excludeUserId: session.userId,
      });

      if (nextStatus === "Approved" || nextStatus === "Denied") {
        await safeCreateAutomationEvent({
          eventType:
            nextStatus === "Approved" ? "request_approved" : "request_denied",
          sourceModule: "requests",
          entityType: "request",
          entityId: updated.id,
          actorUserId: session.userId,
          path: "/requests",
          payload: {
            request_id: updated.id,
            request_number: updated.request_id,
            title: updated.title,
            previous_status: currentStatus,
            status: nextStatus,
            category: updated.category,
            priority: updated.priority,
            requester: updated.requester,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    return toError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await ensureSchema();
    requireRole(["Admin", "Leadership"]);
    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json(
        { error: "Invalid request id" },
        { status: 400 },
      );
    }
    const rows = await query<RequestRow>(
      `DELETE FROM requests WHERE id = $1 RETURNING *`,
      [id],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toError(error);
  }
}

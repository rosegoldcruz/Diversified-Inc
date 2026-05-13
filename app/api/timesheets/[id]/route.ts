import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import {
  canApproveTimesheet,
  HttpError,
  requireRole,
  requireUser,
} from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const TIMESHEET_STATUSES = new Set([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = requireUser();
    const { status } = await req.json();
    const timesheetId = Number(params.id);

    if (!Number.isInteger(timesheetId) || timesheetId <= 0) {
      return NextResponse.json(
        { error: "Invalid timesheet id" },
        { status: 400 },
      );
    }

    if (typeof status !== "string" || !TIMESHEET_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid timesheet status" },
        { status: 400 },
      );
    }

    const existingRows = await query<{
      id: number;
      employee_id: number | null;
      employee_name: string;
      status: string;
    }>(
      `SELECT id, employee_id, employee_name, status FROM timesheets WHERE id = $1`,
      [timesheetId],
    );

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 },
      );
    }

    if (status === "approved" || status === "rejected") {
      requireRole(["Manager", "Admin", "Leadership"]);
      if (!canApproveTimesheet(session, existing)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (
      existing.employee_id !== session.userId &&
      session.role !== "Manager" &&
      session.role !== "Admin" &&
      session.role !== "Leadership"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateSet: string[] = ["status = $1"];
    const values: (string | number)[] = [status];
    let paramIndex = 2;

    if (status === "submitted") {
      updateSet.push(`submitted_at = NOW()`);
    }

    if (status === "approved" || status === "rejected") {
      updateSet.push(`approved_by = $${paramIndex}`);
      values.push(session.userId);
      paramIndex++;
    }

    const result = await query(
      `UPDATE timesheets
       SET ${updateSet.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING *`,
      [...values, timesheetId],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 },
      );
    }

    await createAuditLog({
      actorUserId: session.userId,
      action:
        status === "submitted"
          ? "timesheet.submitted"
          : status === "approved"
            ? "timesheet.approved"
            : status === "rejected"
              ? "timesheet.rejected"
              : "timesheet.updated",
      module: "timesheets",
      entityType: "timesheet",
      entityId: timesheetId,
      beforeData: existing,
      afterData: result[0],
      request: req,
    });

    if (status === "submitted") {
      await safeCreateAutomationEvent({
        eventType: "timesheet_submitted",
        sourceModule: "timesheets",
        entityType: "timesheet",
        entityId: timesheetId,
        actorUserId: session.userId,
        path: "/timesheets",
        payload: {
          timesheet_id: timesheetId,
          employee_id: existing.employee_id,
          employee_name: existing.employee_name,
          previous_status: existing.status,
          status,
        },
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Error updating timesheet:", error);
    return NextResponse.json(
      { error: "Failed to update timesheet" },
      { status: 500 },
    );
  }
}

import { query } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { safeCreateAutomationEvent } from "@/lib/automation-events";
import { HttpError, requireRole } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseId(id: string) {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const itemId = parseId(params.id);
  if (!itemId) {
    return NextResponse.json(
      { error: "Invalid inventory id" },
      { status: 400 },
    );
  }

  try {
    const rows = await query("SELECT * FROM inventory WHERE id = $1", [itemId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const itemId = parseId(params.id);
  if (!itemId) {
    return NextResponse.json(
      { error: "Invalid inventory id" },
      { status: 400 },
    );
  }

  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    const existingRows = await query("SELECT * FROM inventory WHERE id = $1", [
      itemId,
    ]);
    const existing = existingRows[0] ?? null;
    if (!existing) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      quantity?: number;
      status?: string;
      notes?: string;
    };

    const baseUpdates: string[] = [];
    const baseValues: Array<number | string> = [];
    let notesValue: string | undefined;

    if (typeof body.quantity === "number" && Number.isFinite(body.quantity)) {
      baseValues.push(body.quantity);
      baseUpdates.push(`quantity = $${baseValues.length}`);
    }

    if (typeof body.status === "string" && body.status.trim()) {
      baseValues.push(body.status.trim().toLowerCase());
      baseUpdates.push(`status = $${baseValues.length}`);
    }

    if (typeof body.notes === "string") {
      notesValue = body.notes.trim();
    }

    if (baseUpdates.length === 0 && notesValue === undefined) {
      return NextResponse.json(
        { error: "Provide quantity, status, or notes" },
        { status: 400 },
      );
    }

    const buildUpdate = (includeNotes: boolean) => {
      const updates = [...baseUpdates];
      const values: Array<number | string> = [...baseValues];

      if (includeNotes && notesValue !== undefined) {
        values.push(notesValue);
        updates.push(`notes = $${values.length}`);
      }

      if (updates.length === 0) {
        return null;
      }

      values.push(itemId);
      return {
        sql: `UPDATE inventory
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
        values,
      };
    };

    const updateWithNotes = buildUpdate(notesValue !== undefined);
    if (!updateWithNotes) {
      return NextResponse.json(
        { error: "Provide quantity, status, or notes" },
        { status: 400 },
      );
    }

    let updatedRows;
    try {
      updatedRows = await query(updateWithNotes.sql, updateWithNotes.values);
    } catch (error) {
      const isMissingNotesColumn =
        notesValue !== undefined &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "42703";

      if (!isMissingNotesColumn) {
        throw error;
      }

      const fallbackUpdate = buildUpdate(false);
      if (!fallbackUpdate) {
        return NextResponse.json(
          { error: "Provide quantity, status, or notes" },
          { status: 400 },
        );
      }

      updatedRows = await query(fallbackUpdate.sql, fallbackUpdate.values);
    }

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 },
      );
    }

    const updated = updatedRows[0] as Record<string, unknown>;
    await createAuditLog({
      actorUserId: session.userId,
      action: "inventory.updated",
      module: "inventory",
      entityType: "inventory_item",
      entityId: itemId,
      beforeData: existing,
      afterData: updated,
      request,
    });
    const status =
      typeof updated.status === "string" ? updated.status.toLowerCase() : "";
    if (status === "low_stock" || status === "out_of_stock") {
      await safeCreateAutomationEvent({
        eventType: "inventory_low",
        sourceModule: "inventory",
        entityType: "inventory_item",
        entityId: itemId,
        actorUserId: session.userId,
        path: `/inventory/${itemId}`,
        payload: {
          inventory_id: itemId,
          item_name: updated.item_name ?? updated.name ?? null,
          quantity: updated.quantity ?? null,
          status: updated.status ?? null,
          location: updated.location ?? null,
        },
      });
    }

    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import { ensureSchema } from "@/lib/schema";
import {
  ValidationError,
  optionalString,
  requireInteger,
  requireString,
} from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireUser();
    const status = request.nextUrl.searchParams.get("status")?.toLowerCase();
    const whereClause =
      status === "low_stock"
        ? "WHERE LOWER(COALESCE(status, '')) = 'low_stock'"
        : "";

    const rows = await query(`
      SELECT *
      FROM inventory
      ${whereClause}
      ORDER BY status ASC, item_name ASC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireRole(["Manager", "Admin", "Leadership"]);
    await ensureSchema();

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

    const item_name = requireString(body.item_name, "item_name", 200);
    const category = optionalString(body.category, "category", 100);
    const quantity = requireInteger(body.quantity, "quantity", { min: 0 });
    const unit = optionalString(body.unit, "unit", 50);
    const location = optionalString(body.location, "location", 200);
    const reorder_threshold =
      body.reorder_threshold === null || body.reorder_threshold === undefined
        ? null
        : requireInteger(body.reorder_threshold, "reorder_threshold", {
            min: 0,
          });
    const status = optionalString(body.status, "status", 50) || "in_stock";

    const rows = await query(
      `INSERT INTO inventory
        (item_name, category, quantity, unit, location, reorder_threshold, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        item_name,
        category,
        quantity,
        unit,
        location,
        reorder_threshold,
        status,
      ],
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
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
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create inventory item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { query } from "@/lib/db";
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

async function getWorkOrderById(workOrderId: number) {
  const rows = await query(
    `SELECT
      w.*,
      e.name AS owner_name,
      e.name AS assigned_to_name
    FROM work_orders w
    LEFT JOIN employees e ON w.owner = e.id
    WHERE w.id = $1`,
    [workOrderId],
  );

  return rows[0] ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  const workOrderId = parseId(params.id);
  if (!workOrderId) {
    return NextResponse.json(
      { error: "Invalid work order id" },
      { status: 400 },
    );
  }

  try {
    const workOrder = await getWorkOrderById(workOrderId);

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load work order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  const workOrderId = parseId(params.id);
  if (!workOrderId) {
    return NextResponse.json(
      { error: "Invalid work order id" },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as {
      status?: string;
      assigned_to?: number | null;
    };

    const updates: string[] = [];
    const values: Array<string | number | null> = [];

    if (typeof body.status === "string" && body.status.trim()) {
      values.push(body.status.trim().toLowerCase());
      updates.push(`status = $${values.length}`);
    }

    if (body.assigned_to !== undefined) {
      values.push(body.assigned_to);
      updates.push(`owner = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Provide status and/or assigned_to" },
        { status: 400 },
      );
    }

    values.push(workOrderId);

    const updatedRows = await query(
      `UPDATE work_orders
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    const workOrder = await getWorkOrderById(workOrderId);
    return NextResponse.json(workOrder ?? updatedRows[0]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update work order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

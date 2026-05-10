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

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const employeeId = parseId(params.id);
  if (!employeeId) {
    return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
  }

  try {
    const rows = await query("SELECT * FROM employees WHERE id = $1", [
      employeeId,
    ]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

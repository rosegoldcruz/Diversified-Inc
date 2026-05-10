import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(`
      SELECT *
      FROM requests
      ORDER BY submitted_date DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requester, category, priority, description, assigned_reviewer } =
      body as {
        requester: string;
        category: string;
        priority?: string;
        description?: string;
        assigned_reviewer?: string;
      };

    if (!requester || !category) {
      return NextResponse.json(
        { error: "requester and category are required" },
        { status: 400 },
      );
    }

    // Generate request_id with format: REQ-YYYY-###
    const year = new Date().getFullYear();
    const maxIdResult = await query(
      `SELECT MAX(CAST(SUBSTRING(request_id FROM '[0-9]+$') AS INTEGER)) as max_seq FROM requests WHERE request_id LIKE $1`,
      [`REQ-${year}-%`],
    );
    const maxSeq = maxIdResult[0]?.max_seq || 0;
    const nextSeq = maxSeq + 1;
    const request_id = `REQ-${year}-${String(nextSeq).padStart(3, "0")}`;

    const title = `${category} - ${requester}`;

    const rows = await query(
      `
      INSERT INTO requests (request_id, title, requester, category, priority, status, description, assigned_reviewer, submitted_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
      RETURNING *
    `,
      [
        request_id,
        title,
        requester,
        category,
        priority ?? "Medium",
        "Submitted",
        description ?? null,
        assigned_reviewer ?? null,
      ],
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

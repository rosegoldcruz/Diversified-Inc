import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HttpError, requireRole, requireUser } from "@/lib/session";
import {
  ValidationError,
  optionalString,
  requireString,
} from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireUser();
    const rows = await query(`
      SELECT
        s.*,
        e.name AS owner_name
      FROM sops s
      LEFT JOIN employees e ON s.owner = e.id
      ORDER BY s.category ASC
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
      error instanceof Error ? error.message : "Failed to load SOPs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    requireRole(["Manager", "Admin", "Leadership"]);

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

    const title = requireString(body.title, "title", 250);
    const description = optionalString(body.description, "description", 5000);
    const category = optionalString(body.category, "category", 120);
    const status = optionalString(body.status, "status", 80) || "active";
    const version = optionalString(body.version, "version", 50) || "1.0";
    const owner =
      body.owner === undefined || body.owner === null || body.owner === ""
        ? null
        : Number(body.owner);

    const rows = await query(
      `INSERT INTO sops
        (title, description, category, owner, status, version, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        title,
        description,
        category,
        Number.isInteger(owner) ? owner : null,
        status,
        version,
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
      error instanceof Error ? error.message : "Failed to create SOP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

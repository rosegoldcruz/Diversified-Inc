import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import { HttpError, getSession, requireRole } from "@/lib/session";
import { createNotification } from "@/lib/notifications";
import {
  ValidationError,
  optionalString,
  requireEnum,
  requireString,
} from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export async function GET() {
  try {
    await ensureSchema();
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const rows = await query(`
      SELECT *
      FROM requests
      ORDER BY submitted_date DESC
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
      error instanceof Error ? error.message : "Failed to load requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    // Any authenticated user may file a request on their own behalf.
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
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

    // Reviewers/managers may submit on behalf of someone else; otherwise force the requester to the session user.
    const requesterFromBody = optionalString(body.requester, "requester", 200);
    const canImpersonate =
      session.role === "Manager" ||
      session.role === "Admin" ||
      session.role === "Leadership";
    const requester =
      canImpersonate && requesterFromBody ? requesterFromBody : session.name;

    const category = requireString(body.category, "category", 100);
    const priority = body.priority
      ? requireEnum(body.priority, PRIORITIES, "priority")
      : "Medium";
    const description = optionalString(body.description, "description", 5000);
    const assigned_reviewer = optionalString(
      body.assigned_reviewer,
      "assigned_reviewer",
      200,
    );
    const title =
      optionalString(body.title, "title", 200) ?? `${category} - ${requester}`;

    const year = new Date().getFullYear();
    const maxIdResult = await query<{ max_seq: number | null }>(
      `SELECT MAX(CAST(SUBSTRING(request_id FROM '[0-9]+$') AS INTEGER)) as max_seq FROM requests WHERE request_id LIKE $1`,
      [`REQ-${year}-%`],
    );
    const nextSeq = (maxIdResult[0]?.max_seq ?? 0) + 1;
    const request_id = `REQ-${year}-${String(nextSeq).padStart(3, "0")}`;

    const rows = await query(
      `
      INSERT INTO requests
        (request_id, title, requester, category, priority, status,
         description, assigned_reviewer, submitted_date, updated_at, updated_by)
      VALUES ($1, $2, $3, $4, $5, 'Submitted', $6, $7, NOW(), NOW(), $8)
      RETURNING *
    `,
      [
        request_id,
        title,
        requester,
        category,
        priority,
        description,
        assigned_reviewer,
        session.userId,
      ],
    );

    await createNotification({
      type: "request.submitted",
      title: `New request: ${title}`,
      body: `${requester} submitted ${category}`,
      link: "/requests",
      audienceRoles: ["Manager", "Admin", "Leadership"],
      excludeUserId: session.userId,
    });

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
      error instanceof Error ? error.message : "Failed to create request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Avoid unused import warnings while keeping requireRole available to extensions.
void requireRole;

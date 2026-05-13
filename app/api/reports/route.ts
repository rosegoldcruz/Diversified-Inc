import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/session";
import {
  canViewFullReports,
  getWorkspaceReport,
  parseReportFilters,
} from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = requireRole(["Manager", "Admin", "Leadership"]);
    if (!canViewFullReports(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filters = parseReportFilters(request.nextUrl.searchParams);
    const report = await getWorkspaceReport(filters);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[reports.GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to load reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

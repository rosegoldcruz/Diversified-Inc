import { NextRequest, NextResponse } from "next/server";
import { HttpError, requireRole } from "@/lib/session";
import {
  canViewFullReports,
  getWorkspaceReport,
  parseReportFilters,
  reportToCsv,
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
    const csv = reportToCsv(report);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `diversified-os-report-${stamp}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[reports.export.GET]", error);
    const message =
      error instanceof Error ? error.message : "Failed to export reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

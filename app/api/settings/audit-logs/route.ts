import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 20;
    const rows = await getAuditLogs(limit);

    return NextResponse.json({
      logs: rows,
      count: rows.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load audit logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Liveness/readiness probe for Railway. Public (allow-listed in middleware).
// Returns 200 when the process is up; reports DB reachability without failing
// the probe so a DB blip does not cause Railway to restart-loop the web service.
export async function GET() {
  let db: "ok" | "error" | "unconfigured" = "unconfigured";
  if (process.env.DATABASE_URL) {
    try {
      await query("SELECT 1");
      db = "ok";
    } catch {
      db = "error";
    }
  }
  return NextResponse.json(
    { status: "ok", db, time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

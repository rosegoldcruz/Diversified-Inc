import { NextResponse } from "next/server";
import { clearAdminPortalSessionCookie } from "@/lib/admin-portal-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const clear = clearAdminPortalSessionCookie();
  response.cookies.set(clear.name, clear.value, clear.options);
  return response;
}

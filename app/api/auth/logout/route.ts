import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { buildLogoutUrl } from "@/lib/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function GET(request: NextRequest) {
  try {
    const logoutUrl = await buildLogoutUrl();
    const response = NextResponse.redirect(new URL(logoutUrl, request.url));
    clearSessionCookie(response);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearSessionCookie(response);
    return response;
  }
}

export async function POST() {
  let logoutUrl = "/login";
  try {
    logoutUrl = await buildLogoutUrl();
  } catch {
    logoutUrl = "/login";
  }

  const response = NextResponse.json({ ok: true, logoutUrl });
  clearSessionCookie(response);
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-shared";
import { verifySessionEdge } from "@/lib/auth-edge";

/**
 * Edge middleware: gate every route behind a valid session except for a small
 * allow-list (login page, auth API, public assets, health checks).
 *
 * Uses HMAC verification only (no DB calls) so it is Edge-runtime safe.
 */

const PUBLIC_PATHS: RegExp[] = [
  /^\/login(?:\/.*)?$/,
  /^\/api\/auth\/(login|logout|me|callback|local-login)$/,
  /^\/api\/health$/,
  /^\/manifest\.webmanifest$/,
  /^\/favicon\.ico$/,
  /^\/divco-static\.svg$/,
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((re) => re.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionEdge(token);

  if (!session) {
    // For API routes, return JSON 401 so the client can handle it gracefully.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname && pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Forward identity to downstream handlers via request headers (optional convenience).
  const headers = new Headers(request.headers);
  headers.set("x-user-id", String(session.userId));
  headers.set("x-user-role", session.role);
  headers.set("x-user-email", session.email);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Run on every path except Next internal assets and static files.
    "/((?!_next/static|_next/image|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)",
  ],
};

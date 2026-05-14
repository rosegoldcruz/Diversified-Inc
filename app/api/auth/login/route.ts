import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizationUrl,
  createPkceChallenge,
  createPkceVerifier,
  createOidcState,
  OIDC_COOKIE_OPTIONS,
  OIDC_NEXT_COOKIE,
  OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE,
  sanitizeNextPath,
} from "@/lib/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLoginError(request: NextRequest, message: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

async function startLogin(request: NextRequest) {
  try {
    const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    const state = createOidcState();
    const verifier = createPkceVerifier();
    const challenge = createPkceChallenge(verifier);
    const authorizationUrl = await buildAuthorizationUrl(state, challenge);

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(OIDC_STATE_COOKIE, state, OIDC_COOKIE_OPTIONS);
    response.cookies.set(OIDC_NEXT_COOKIE, nextPath, OIDC_COOKIE_OPTIONS);
    response.cookies.set(OIDC_VERIFIER_COOKIE, verifier, OIDC_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("[auth.login]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Authentication is not configured";
    return redirectToLoginError(request, message);
  }
}

export async function GET(request: NextRequest) {
  return startLogin(request);
}

export async function POST(request: NextRequest) {
  return startLogin(request);
}

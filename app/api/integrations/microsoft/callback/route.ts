import { NextRequest, NextResponse } from "next/server";
import { handleMicrosoftOAuthCallback } from "@/lib/microsoft-calendar";
import { HttpError, requireUser } from "@/lib/session";

const OAUTH_STATE_COOKIE = "microsoft_oauth_state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCalendarRedirect(
  request: NextRequest,
  result: "connected" | "error",
  message?: string,
) {
  const url = new URL("/calendar", request.nextUrl.origin);
  url.searchParams.set("microsoft", result);
  if (message) {
    url.searchParams.set("details", message.slice(0, 180));
  }
  return url;
}

export async function GET(request: NextRequest) {
  const responseState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription =
    request.nextUrl.searchParams.get("error_description") ||
    "OAuth callback failed";

  try {
    const session = requireUser();

    const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!expectedState || !responseState || expectedState !== responseState) {
      const response = NextResponse.redirect(
        toCalendarRedirect(request, "error", "Invalid OAuth state."),
      );
      response.cookies.delete(OAUTH_STATE_COOKIE);
      return response;
    }

    const expectedPrefix = `${session.userId}:`;
    if (!expectedState.startsWith(expectedPrefix)) {
      const response = NextResponse.redirect(
        toCalendarRedirect(request, "error", "OAuth user mismatch."),
      );
      response.cookies.delete(OAUTH_STATE_COOKIE);
      return response;
    }

    if (error) {
      const response = NextResponse.redirect(
        toCalendarRedirect(request, "error", errorDescription),
      );
      response.cookies.delete(OAUTH_STATE_COOKIE);
      return response;
    }

    if (!code) {
      const response = NextResponse.redirect(
        toCalendarRedirect(
          request,
          "error",
          "Missing OAuth authorization code.",
        ),
      );
      response.cookies.delete(OAUTH_STATE_COOKIE);
      return response;
    }

    await handleMicrosoftOAuthCallback({ userId: session.userId, code });

    const success = NextResponse.redirect(
      toCalendarRedirect(request, "connected"),
    );
    success.cookies.delete(OAUTH_STATE_COOKIE);
    return success;
  } catch (callbackError) {
    if (callbackError instanceof HttpError) {
      return NextResponse.json(
        { error: callbackError.message },
        { status: callbackError.status },
      );
    }

    const response = NextResponse.redirect(
      toCalendarRedirect(
        request,
        "error",
        callbackError instanceof Error
          ? callbackError.message
          : "Microsoft callback failed",
      ),
    );
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  }
}

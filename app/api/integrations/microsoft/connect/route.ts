import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildMicrosoftAuthorizeUrl,
  hasMicrosoftEnvConfigured,
} from "@/lib/microsoft-calendar";
import { HttpError, requireUser } from "@/lib/session";

const OAUTH_STATE_COOKIE = "microsoft_oauth_state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const session = requireUser();
    if (!hasMicrosoftEnvConfigured()) {
      return NextResponse.json(
        {
          error:
            "Microsoft 365 integration is not configured. Missing required environment variables.",
        },
        { status: 400 },
      );
    }

    const state = `${session.userId}:${randomBytes(16).toString("hex")}`;
    const authorizeUrl = buildMicrosoftAuthorizeUrl(state);
    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set({
      name: OAUTH_STATE_COOKIE,
      value: state,
      maxAge: 10 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start Microsoft OAuth";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

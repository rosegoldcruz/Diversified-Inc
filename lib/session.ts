import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  Role,
  SESSION_COOKIE,
  SessionPayload,
  roleSatisfies,
  verifySession,
} from "./auth";

/**
 * Read the current session (if any) from the request cookies.
 * Returns `null` for unauthenticated requests.
 */
export function getSession(): SessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Require an authenticated session. Throws a 401 HttpError if missing/invalid.
 * Callers should let `withApiHandler` translate the error into a response,
 * or `catch` it themselves.
 */
export function requireUser(): SessionPayload {
  const session = getSession();
  if (!session) {
    throw new HttpError(401, "Authentication required");
  }
  return session;
}

/** Require a session AND a satisfying role (with hierarchy). */
export function requireRole(required: Role | Role[]): SessionPayload {
  const session = requireUser();
  if (!roleSatisfies(session.role, required)) {
    throw new HttpError(403, "Forbidden");
  }
  return session;
}

/**
 * Convenience HTTP response helpers for API routes.
 */
export const apiErrors = {
  unauthorized: () =>
    NextResponse.json({ error: "Authentication required" }, { status: 401 }),
  forbidden: () => NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  badRequest: (message: string, details?: unknown) =>
    NextResponse.json({ error: message, details }, { status: 400 }),
  notFound: (message = "Not found") =>
    NextResponse.json({ error: message }, { status: 404 }),
  conflict: (message: string) =>
    NextResponse.json({ error: message }, { status: 409 }),
  serverError: (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  },
};

/**
 * Wrap an API route handler so that thrown HttpErrors become consistent
 * JSON responses with the right status code.
 */
export function withApiHandler<TArgs extends unknown[], R>(
  handler: (...args: TArgs) => Promise<R>,
) {
  return async (...args: TArgs): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("[api]", error);
      return apiErrors.serverError(error);
    }
  };
}

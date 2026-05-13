import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  Role,
  ROLES,
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

export const getCurrentUser = getSession;

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

export const requireSession = requireUser;

/** Require a session AND a satisfying role (with hierarchy). */
export function requireRole(required: Role | Role[]): SessionPayload {
  const session = requireUser();
  if (!roleSatisfies(session.role, required)) {
    throw new HttpError(403, "Forbidden");
  }
  return session;
}

export const requireAnyRole = requireRole;

export function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") return null;
  const normalized = ROLES.find(
    (candidate) => candidate.toLowerCase() === role.trim().toLowerCase(),
  );
  return normalized ?? null;
}

export function canManageUser(
  actor: Pick<SessionPayload, "userId" | "role">,
  targetUser: { id?: number | null; role?: unknown } | null,
) {
  if (!targetUser) return false;
  if (actor.role === "Leadership") return true;
  if (actor.role !== "Admin") return false;
  return normalizeRole(targetUser.role) !== "Leadership";
}

export function canMutateTask(
  actor: Pick<SessionPayload, "userId" | "role">,
  task: { assigned_to?: number | null; created_by?: number | null } | null,
) {
  if (!task) return false;
  if (roleSatisfies(actor.role, "Manager")) return true;
  return task.assigned_to === actor.userId || task.created_by === actor.userId;
}

export function canApproveTimesheet(
  actor: Pick<SessionPayload, "role">,
  _timesheet: unknown,
) {
  return roleSatisfies(actor.role, "Manager");
}

export function canAccessFile(
  actor: Pick<SessionPayload, "userId" | "role">,
  file: { uploaded_by_user_id?: number | null } | null,
) {
  if (!file) return false;
  if (roleSatisfies(actor.role, "Manager")) return true;
  return file.uploaded_by_user_id === actor.userId;
}

/**
 * Convenience HTTP response helpers for API routes.
 */
export const apiErrors = {
  unauthorized,
  forbidden,
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

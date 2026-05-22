import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

const ADMIN_COOKIE = "divos_admin_session";
const ADMIN_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || 1800);

type AdminSessionPayload = {
  userId: number;
  role: "Admin" | "Leadership";
  iat: number;
  exp: number;
  scope: "admin_portal";
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET must be configured.");
  }
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64",
  );
}

function sign(data: string): string {
  return base64UrlEncode(
    createHmac("sha256", getSecret()).update(data).digest(),
  );
}

export function signAdminPortalSession(input: {
  userId: number;
  role: "Admin" | "Leadership";
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    userId: input.userId,
    role: input.role,
    iat: now,
    exp: now + ADMIN_TTL_SECONDS,
    scope: "admin_portal",
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(body);
  return {
    token: `${body}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
}

function verifyToken(
  token: string | undefined | null,
): AdminSessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = sign(body);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(
      base64UrlDecode(body).toString("utf8"),
    ) as AdminSessionPayload;
    if (!parsed || parsed.scope !== "admin_portal") return null;
    if (!Number.isInteger(parsed.userId) || parsed.userId <= 0) return null;
    if (parsed.role !== "Admin" && parsed.role !== "Leadership") return null;
    if (
      typeof parsed.exp !== "number" ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAdminPortalCookieName() {
  return ADMIN_COOKIE;
}

export function getAdminPortalSession() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifyToken(token);
}

export function clearAdminPortalSessionCookie() {
  return {
    name: ADMIN_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    },
  };
}

export function adminPortalCookie(token: string, expiresAt: Date) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
      maxAge: ADMIN_TTL_SECONDS,
    },
  };
}

export function getAdminPortalAccess() {
  const session = getSession();
  if (!session) {
    return { allowed: false, reason: "AUTH_REQUIRED" as const, session: null };
  }

  if (session.role !== "Admin" && session.role !== "Leadership") {
    return {
      allowed: false,
      reason: "ROLE_FORBIDDEN" as const,
      session,
    };
  }

  const adminSession = getAdminPortalSession();
  if (!adminSession || adminSession.userId !== session.userId) {
    return {
      allowed: false,
      reason: "ADMIN_REAUTH_REQUIRED" as const,
      session,
    };
  }

  return {
    allowed: true,
    reason: "OK" as const,
    session,
    adminSession,
  };
}

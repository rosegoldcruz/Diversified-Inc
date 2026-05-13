import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Role hierarchy. Higher index = more authority.
 * `requireRole` accepts any of the provided roles OR any higher role.
 */
export const ROLES = ["Employee", "Manager", "Admin", "Leadership"] as const;
export type Role = (typeof ROLES)[number];

export const SESSION_COOKIE = "divos_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.DATABASE_PASSWORD;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET (or DATABASE_PASSWORD fallback) must be set for auth.",
    );
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

export function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
  ttlSeconds: number = SESSION_TTL_SECONDS,
): { token: string; expiresAt: Date } {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const body = base64UrlEncode(JSON.stringify(full));
  const sig = sign(body);
  return {
    token: `${body}.${sig}`,
    expiresAt: new Date(full.exp * 1000),
  };
}

export function verifySession(
  token: string | undefined | null,
): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  const expected = sign(body);
  // Use timingSafeEqual on equal-length buffers
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const json = JSON.parse(
      base64UrlDecode(body).toString("utf8"),
    ) as SessionPayload;
    if (!json || typeof json.userId !== "number") return null;
    if (
      typeof json.exp !== "number" ||
      json.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    if (!ROLES.includes(json.role)) return null;
    return json;
  } catch {
    return null;
  }
}

/** Hash a password using scrypt with a random salt. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const keyLen = 64;
  const derived = scryptSync(password, salt, keyLen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Verify a password against a stored hash produced by `hashPassword`. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], "hex");
    const hash = Buffer.from(parts[5], "hex");
    const derived = scryptSync(password, salt, hash.length, { N, r, p });
    return derived.length === hash.length && timingSafeEqual(derived, hash);
  } catch {
    return false;
  }
}

/**
 * Returns true if `userRole` satisfies any of the `required` roles based on
 * the ROLES hierarchy (Leadership > Admin > Manager > Employee).
 */
export function roleSatisfies(
  userRole: Role,
  required: Role | Role[],
): boolean {
  const requiredList = Array.isArray(required) ? required : [required];
  const userIdx = ROLES.indexOf(userRole);
  if (userIdx === -1) return false;
  return requiredList.some((r) => userIdx >= ROLES.indexOf(r));
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_SECONDS,
};

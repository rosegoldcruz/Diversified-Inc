import { ROLES, type SessionPayload } from "@/lib/auth-shared";

function getSecret(): string | null {
  return process.env.SESSION_SECRET?.trim() || null;
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  return atob(base64 + pad);
}

function timingSafeEqualText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

async function sign(body: string): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );

  return encodeBase64Url(new Uint8Array(signature));
}

export async function verifySessionEdge(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expected = await sign(body);
  if (!expected || !timingSafeEqualText(signature, expected)) {
    return null;
  }

  try {
    const json = JSON.parse(decodeBase64Url(body)) as SessionPayload;
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

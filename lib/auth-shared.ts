export const ROLES = ["Employee", "Manager", "Admin", "Leadership"] as const;
export type Role = (typeof ROLES)[number];

export const SESSION_COOKIE = "divos_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
  role: Role;
  provider?: "local" | "zitadel";
  subject?: string;
  iat: number;
  exp: number;
};

export function roleSatisfies(
  userRole: Role,
  required: Role | Role[],
): boolean {
  const requiredList = Array.isArray(required) ? required : [required];
  const userIdx = ROLES.indexOf(userRole);
  if (userIdx === -1) return false;
  return requiredList.some((role) => userIdx >= ROLES.indexOf(role));
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_TTL_SECONDS,
};

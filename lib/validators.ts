import { ROLES, Role } from "./auth";

export class ValidationError extends Error {
  details: Record<string, string>;
  constructor(message: string, details: Record<string, string> = {}) {
    super(message);
    this.details = details;
  }
}

function asString(
  value: unknown,
  label: string,
  opts: { max?: number; required?: boolean } = {},
): string | null {
  const { max = 500, required = false } = opts;
  if (value === undefined || value === null || value === "") {
    if (required) throw new ValidationError(`${label} is required`);
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${label} must be a string`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw new ValidationError(`${label} is required`);
  }
  if (trimmed.length > max) {
    throw new ValidationError(`${label} must be ${max} characters or fewer`);
  }
  return trimmed;
}

export function requireString(
  value: unknown,
  label: string,
  max = 500,
): string {
  const out = asString(value, label, { required: true, max });
  if (!out) throw new ValidationError(`${label} is required`);
  return out;
}

export function optionalString(
  value: unknown,
  label: string,
  max = 5000,
): string | null {
  return asString(value, label, { required: false, max });
}

export function requireEmail(value: unknown, label = "email"): string {
  const str = requireString(value, label, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    throw new ValidationError(`${label} must be a valid email address`);
  }
  return str;
}

export function requireRoleValue(value: unknown, label = "role"): Role {
  const str = requireString(value, label, 50);
  if (!ROLES.includes(str as Role)) {
    throw new ValidationError(`${label} must be one of: ${ROLES.join(", ")}`);
  }
  return str as Role;
}

export function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  const str = requireString(value, label, 50);
  if (!allowed.includes(str as T)) {
    throw new ValidationError(`${label} must be one of: ${allowed.join(", ")}`);
  }
  return str as T;
}

export function optionalEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T | null {
  if (value === undefined || value === null || value === "") return null;
  return requireEnum(value, allowed, label);
}

export function requireInteger(
  value: unknown,
  label: string,
  opts: { min?: number; max?: number } = {},
): number {
  const { min = 1, max = Number.MAX_SAFE_INTEGER } = opts;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ValidationError(
      `${label} must be an integer between ${min} and ${max}`,
    );
  }
  return n;
}

export function parsePassword(value: unknown, label = "password"): string {
  const pw = requireString(value, label, 200);
  if (pw.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }
  return pw;
}

import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";
import {
  ROLES,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  type Role,
  signSession,
} from "@/lib/auth";
import {
  clearOidcHandshakeCookies,
  exchangeCodeForTokens,
  fetchOidcUserInfo,
  getDisplayName,
  OIDC_NEXT_COOKIE,
  OIDC_STATE_COOKIE,
  sanitizeNextPath,
  type OidcUserInfo,
} from "@/lib/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmployeeRow = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  status: string | null;
  department: string | null;
};

function makeLoginErrorResponse(
  request: NextRequest,
  message: string,
): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", message);
  const response = NextResponse.redirect(loginUrl);
  clearOidcHandshakeCookies(response);
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

async function findOrProvisionEmployee(
  profile: OidcUserInfo,
): Promise<{ employee: EmployeeRow; pending: boolean; created: boolean }> {
  const email =
    typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
  if (!email) {
    throw new Error(
      "Your Zitadel account did not provide a usable email address.",
    );
  }

  const name = getDisplayName(profile, email);

  return withTransaction(async (q) => {
    let rows = await q<EmployeeRow>(
      `SELECT id, name, email, role, status, department
       FROM employees
       WHERE auth_provider = 'zitadel' AND auth_subject = $1
       LIMIT 1`,
      [profile.sub],
    );

    if (rows.length === 0) {
      rows = await q<EmployeeRow>(
        `SELECT id, name, email, role, status, department
         FROM employees
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [email],
      );
    }

    if (rows.length === 0) {
      const inserted = await q<EmployeeRow>(
        `INSERT INTO employees
          (name, role, department, status, email, auth_provider, auth_subject, auth_last_synced_at, hire_date)
         VALUES ($1, 'Employee', 'Pending Access', 'inactive', $2, 'zitadel', $3, NOW(), CURRENT_DATE)
         RETURNING id, name, email, role, status, department`,
        [name, email, profile.sub],
      );

      return { employee: inserted[0], pending: true, created: true };
    }

    const updated = await q<EmployeeRow>(
      `UPDATE employees
       SET name = $1,
           email = $2,
           auth_provider = 'zitadel',
           auth_subject = $3,
           auth_last_synced_at = NOW(),
           last_login_at = CASE WHEN status = 'active' THEN NOW() ELSE last_login_at END
       WHERE id = $4
       RETURNING id, name, email, role, status, department`,
      [name, email, profile.sub, rows[0].id],
    );

    return {
      employee: updated[0],
      pending: updated[0].status !== "active",
      created: false,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    await ensureSchema();

    const error = request.nextUrl.searchParams.get("error");
    const errorDescription =
      request.nextUrl.searchParams.get("error_description");
    if (error) {
      return makeLoginErrorResponse(
        request,
        errorDescription || error || "Sign-in was canceled.",
      );
    }

    const expectedState = request.cookies.get(OIDC_STATE_COOKIE)?.value;
    const nextPath = sanitizeNextPath(
      request.cookies.get(OIDC_NEXT_COOKIE)?.value,
    );
    const state = request.nextUrl.searchParams.get("state");
    const code = request.nextUrl.searchParams.get("code");

    if (!expectedState || !state || expectedState !== state) {
      return makeLoginErrorResponse(
        request,
        "Sign-in state could not be verified. Please try again.",
      );
    }

    if (!code) {
      return makeLoginErrorResponse(
        request,
        "Zitadel did not return an authorization code.",
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchOidcUserInfo(tokens.access_token);
    const mapped = await findOrProvisionEmployee(profile);

    if (mapped.pending) {
      return makeLoginErrorResponse(
        request,
        mapped.created
          ? "Your account is pending access. A Diversified OS employee record was created and must be activated by an administrator."
          : "Your Diversified OS account is inactive. Contact an administrator for access.",
      );
    }

    const role: Role = ROLES.includes(mapped.employee.role as Role)
      ? (mapped.employee.role as Role)
      : "Employee";

    const { token, expiresAt } = signSession({
      userId: mapped.employee.id,
      email: mapped.employee.email || profile.email || "",
      name: mapped.employee.name,
      role,
      provider: "zitadel",
      subject: profile.sub,
    });

    const response = NextResponse.redirect(new URL(nextPath, request.url));
    clearOidcHandshakeCookies(response);
    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    console.error("[auth.callback]", error);
    const message = error instanceof Error ? error.message : "Sign-in failed";
    return makeLoginErrorResponse(request, message);
  }
}

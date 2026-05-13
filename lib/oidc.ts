import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const OIDC_STATE_COOKIE = "divos_oidc_state";
export const OIDC_NEXT_COOKIE = "divos_oidc_next";

export const OIDC_COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 10,
};

type OidcDiscovery = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint?: string;
};

export type OidcUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
};

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
};

let discoveryPromise: Promise<OidcDiscovery> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getIssuer(): string {
  return requireEnv("ZITADEL_ISSUER").replace(/\/+$/, "");
}

function getAppUrl(): string {
  const appUrl =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return appUrl.replace(/\/+$/, "");
  }
  throw new Error("APP_URL or NEXT_PUBLIC_APP_URL must be configured");
}

export function getRedirectUri(): string {
  return (
    process.env.ZITADEL_REDIRECT_URI?.trim() ||
    `${getAppUrl()}/api/auth/callback`
  );
}

export function getPostLogoutRedirectUri(): string {
  return (
    process.env.ZITADEL_POST_LOGOUT_REDIRECT_URI?.trim() ||
    `${getAppUrl()}/login`
  );
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export async function getOidcDiscovery(): Promise<OidcDiscovery> {
  if (!discoveryPromise) {
    discoveryPromise = fetch(
      `${getIssuer()}/.well-known/openid-configuration`,
      {
        cache: "no-store",
      },
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load Zitadel discovery document (${response.status})`,
        );
      }
      return parseJson<OidcDiscovery>(response);
    });
  }

  return discoveryPromise;
}

export function createOidcState(): string {
  return randomBytes(24).toString("hex");
}

export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export function clearOidcHandshakeCookies(response: NextResponse): void {
  response.cookies.set(OIDC_STATE_COOKIE, "", {
    ...OIDC_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(OIDC_NEXT_COOKIE, "", {
    ...OIDC_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function buildAuthorizationUrl(state: string): Promise<string> {
  const discovery = await getOidcDiscovery();
  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set("client_id", requireEnv("ZITADEL_CLIENT_ID"));
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const discovery = await getOidcDiscovery();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: requireEnv("ZITADEL_CLIENT_ID"),
    client_secret: requireEnv("ZITADEL_CLIENT_SECRET"),
    redirect_uri: getRedirectUri(),
  });

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = await parseJson<Record<string, unknown>>(response);
  if (!response.ok) {
    const message =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : `Token exchange failed (${response.status})`;
    throw new Error(message);
  }

  if (typeof payload.access_token !== "string") {
    throw new Error("Zitadel did not return an access token");
  }

  return payload as unknown as TokenResponse;
}

export async function fetchOidcUserInfo(
  accessToken: string,
): Promise<OidcUserInfo> {
  const discovery = await getOidcDiscovery();
  const response = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await parseJson<Record<string, unknown>>(response);
  if (!response.ok) {
    const message =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : `Failed to load user profile (${response.status})`;
    throw new Error(message);
  }

  if (typeof payload.sub !== "string") {
    throw new Error(
      "Zitadel user profile did not include a subject identifier",
    );
  }

  return payload as unknown as OidcUserInfo;
}

export async function buildLogoutUrl(): Promise<string> {
  const postLogoutRedirectUri = getPostLogoutRedirectUri();

  try {
    const discovery = await getOidcDiscovery();
    if (!discovery.end_session_endpoint) {
      return postLogoutRedirectUri;
    }
    const url = new URL(discovery.end_session_endpoint);
    url.searchParams.set("client_id", requireEnv("ZITADEL_CLIENT_ID"));
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    return url.toString();
  } catch {
    return postLogoutRedirectUri;
  }
}

export function getDisplayName(
  profile: OidcUserInfo,
  fallbackEmail: string,
): string {
  return (
    profile.name?.trim() ||
    profile.preferred_username?.trim() ||
    [profile.given_name?.trim(), profile.family_name?.trim()]
      .filter(Boolean)
      .join(" ") ||
    fallbackEmail
  );
}

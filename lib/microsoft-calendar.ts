import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { query, withTransaction } from "@/lib/db";

const DEFAULT_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "Calendars.Read",
];
const MICROSOFT_PROVIDER = "microsoft_365";
const TOKEN_REFRESH_SKEW_SECONDS = 120;

type MicrosoftTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
};

type MicrosoftMeResponse = {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
};

type MicrosoftConnectionRow = {
  id: string;
  user_id: number;
  microsoft_user_id: string | null;
  email: string | null;
  display_name: string | null;
  tenant_id: string | null;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  token_expires_at: string | null;
  scopes: string | null;
  status: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
};

type CachedEventRow = {
  id: string;
  connection_id: string | null;
  user_id: number;
  outlook_event_id: string;
  subject: string | null;
  body_preview: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  location: string | null;
  web_link: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  response_status: string | null;
  raw: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceMicrosoftSummary = {
  connected_count: string;
  latest_sync_at: string | null;
};

export type MicrosoftIntegrationStatus = {
  configured: boolean;
  connected: boolean;
  status: "Missing" | "Configured" | "Connected";
  missingEnv: string[];
  connection: null | {
    email: string | null;
    displayName: string | null;
    status: string | null;
    lastSyncAt: string | null;
  };
};

export type MicrosoftWorkspaceStatus = {
  configured: boolean;
  connected: boolean;
  status: "Missing" | "Configured" | "Connected";
  missingEnv: string[];
  connectedCount: number;
  latestSyncAt: string | null;
};

export type OutlookCachedEvent = {
  id: string;
  outlook_event_id: string;
  subject: string | null;
  body_preview: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  location: string | null;
  web_link: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  response_status: string | null;
};

type SyncCalendarOptions = {
  userId: number;
  from: Date;
  to: Date;
};

type SyncCalendarResult = {
  eventCount: number;
  from: string;
  to: string;
  lastSyncAt: string;
};

function getMissingMicrosoftEnv() {
  const required = [
    "MICROSOFT_GRAPH_CLIENT_ID",
    "MICROSOFT_GRAPH_CLIENT_SECRET",
    "MICROSOFT_GRAPH_REDIRECT_URI",
    "MICROSOFT_GRAPH_TOKEN_ENCRYPTION_KEY",
  ];

  const missing = required.filter(
    (name) => !process.env[name] || !process.env[name]?.trim(),
  );

  if (
    process.env.MICROSOFT_GRAPH_TOKEN_ENCRYPTION_KEY &&
    process.env.MICROSOFT_GRAPH_TOKEN_ENCRYPTION_KEY.length < 32
  ) {
    missing.push("MICROSOFT_GRAPH_TOKEN_ENCRYPTION_KEY(>=32 chars)");
  }

  return missing;
}

export function hasMicrosoftEnvConfigured() {
  return getMissingMicrosoftEnv().length === 0;
}

function requireMicrosoftEnv() {
  const missingEnv = getMissingMicrosoftEnv();
  if (missingEnv.length > 0) {
    throw new Error(
      `Microsoft 365 integration is missing env vars: ${missingEnv.join(", ")}`,
    );
  }

  const normalizeEnvValue = (value: string) => {
    const trimmed = value.trim().replace(/[\r\n]+/g, "");
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  };

  const clientId = normalizeEnvValue(
    process.env.MICROSOFT_GRAPH_CLIENT_ID as string,
  );
  const clientSecret = normalizeEnvValue(
    process.env.MICROSOFT_GRAPH_CLIENT_SECRET as string,
  );
  const tenantId = normalizeEnvValue(
    process.env.MICROSOFT_GRAPH_TENANT_ID?.trim() || "common",
  );
  const redirectUri = normalizeEnvValue(
    process.env.MICROSOFT_GRAPH_REDIRECT_URI as string,
  );

  const uuidLikeSecret =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      clientSecret,
    );

  if (uuidLikeSecret) {
    throw new Error(
      "MICROSOFT_GRAPH_CLIENT_SECRET appears to be a Secret ID (UUID). Use the Secret VALUE from Entra.",
    );
  }

  if (!clientSecret) {
    throw new Error(
      "MICROSOFT_GRAPH_CLIENT_SECRET is empty after normalization.",
    );
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    redirectUri,
    scopes: getMicrosoftScopes(),
  };
}

function getMicrosoftScopes() {
  const configured = process.env.MICROSOFT_SCOPES?.trim();
  if (!configured) return DEFAULT_SCOPES;
  return configured.split(/\s+/).filter(Boolean);
}

function getTokenEncryptionKey() {
  const secret = process.env.MICROSOFT_GRAPH_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "MICROSOFT_GRAPH_TOKEN_ENCRYPTION_KEY must be set and at least 32 characters.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

function encryptToken(value: string) {
  const key = getTokenEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

function decryptToken(value: string) {
  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid token encryption payload format.");
  }

  const key = getTokenEncryptionKey();
  const iv = Buffer.from(parts[1], "base64");
  const authTag = Buffer.from(parts[2], "base64");
  const encrypted = Buffer.from(parts[3], "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export async function ensureMicrosoftCalendarTables() {
  await query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  await query(`CREATE TABLE IF NOT EXISTS microsoft_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    microsoft_user_id TEXT,
    email TEXT,
    display_name TEXT,
    tenant_id TEXT,
    access_token_enc TEXT,
    refresh_token_enc TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT,
    status TEXT DEFAULT 'connected',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  await query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_microsoft_connections_user_id ON microsoft_connections (user_id)",
  );

  await query(`CREATE TABLE IF NOT EXISTS outlook_calendar_events_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID,
    user_id INTEGER NOT NULL,
    outlook_event_id TEXT NOT NULL,
    subject TEXT,
    body_preview TEXT,
    organizer_name TEXT,
    organizer_email TEXT,
    location TEXT,
    web_link TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    response_status TEXT,
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, outlook_event_id)
  )`);

  await query(
    "CREATE INDEX IF NOT EXISTS idx_outlook_events_user_time ON outlook_calendar_events_cache (user_id, start_time, end_time)",
  );

  await query(`CREATE TABLE IF NOT EXISTS calendar_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER,
    provider TEXT DEFAULT 'microsoft_365',
    status TEXT,
    message TEXT,
    event_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    metadata JSONB
  )`);

  await query(
    "CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_provider_started ON calendar_sync_logs (provider, started_at DESC)",
  );
}

function toIsoDateTime(value: string | null | undefined) {
  if (!value) return null;
  const normalized = /[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function getTokenEndpoint(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
}

function getAuthorizeEndpoint(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
}

async function exchangeToken(params: URLSearchParams, tenantId: string) {
  const response = await fetch(getTokenEndpoint(tenantId), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | MicrosoftTokenResponse
    | { error?: string; error_description?: string }
    | null;

  if (!response.ok || !body || !("access_token" in body)) {
    const message =
      body && "error_description" in body && body.error_description
        ? body.error_description
        : `Token exchange failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

async function fetchMicrosoftMe(accessToken: string) {
  const meRes = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const me = (await meRes
    .json()
    .catch(() => null)) as MicrosoftMeResponse | null;
  if (!meRes.ok || !me?.id) {
    throw new Error(`Failed to fetch Microsoft profile (${meRes.status})`);
  }
  return me;
}

async function upsertMicrosoftConnection(args: {
  userId: number;
  microsoftUserId: string;
  email: string | null;
  displayName: string | null;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  scopes: string;
}) {
  await ensureMicrosoftCalendarTables();
  const tokenExpiresAt = new Date(
    Date.now() + args.expiresInSeconds * 1000,
  ).toISOString();

  const rows = await query<MicrosoftConnectionRow>(
    `INSERT INTO microsoft_connections
      (user_id, microsoft_user_id, email, display_name, tenant_id,
       access_token_enc, refresh_token_enc, token_expires_at, scopes,
       status, updated_at)
     VALUES
      ($1, $2, $3, $4, $5,
       $6, $7, $8, $9,
       'connected', NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET microsoft_user_id = EXCLUDED.microsoft_user_id,
           email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           tenant_id = EXCLUDED.tenant_id,
           access_token_enc = EXCLUDED.access_token_enc,
           refresh_token_enc = EXCLUDED.refresh_token_enc,
           token_expires_at = EXCLUDED.token_expires_at,
           scopes = EXCLUDED.scopes,
           status = 'connected',
           updated_at = NOW()
     RETURNING *`,
    [
      args.userId,
      args.microsoftUserId,
      args.email,
      args.displayName,
      args.tenantId,
      encryptToken(args.accessToken),
      encryptToken(args.refreshToken),
      tokenExpiresAt,
      args.scopes,
    ],
  );

  return rows[0];
}

async function getConnectionByUserId(userId: number) {
  await ensureMicrosoftCalendarTables();
  const rows = await query<MicrosoftConnectionRow>(
    `SELECT *
     FROM microsoft_connections
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function getMicrosoftIntegrationStatusForUser(
  userId: number,
): Promise<MicrosoftIntegrationStatus> {
  const missingEnv = getMissingMicrosoftEnv();
  if (missingEnv.length > 0) {
    return {
      configured: false,
      connected: false,
      status: "Missing",
      missingEnv,
      connection: null,
    };
  }

  const connection = await getConnectionByUserId(userId);
  if (!connection) {
    return {
      configured: true,
      connected: false,
      status: "Configured",
      missingEnv: [],
      connection: null,
    };
  }

  return {
    configured: true,
    connected: connection.status === "connected",
    status: connection.status === "connected" ? "Connected" : "Configured",
    missingEnv: [],
    connection: {
      email: connection.email,
      displayName: connection.display_name,
      status: connection.status,
      lastSyncAt: connection.last_sync_at,
    },
  };
}

export async function getMicrosoftWorkspaceStatus(): Promise<MicrosoftWorkspaceStatus> {
  const missingEnv = getMissingMicrosoftEnv();
  if (missingEnv.length > 0) {
    return {
      configured: false,
      connected: false,
      status: "Missing",
      missingEnv,
      connectedCount: 0,
      latestSyncAt: null,
    };
  }

  await ensureMicrosoftCalendarTables();
  const rows = await query<WorkspaceMicrosoftSummary>(
    `SELECT COUNT(*)::text AS connected_count,
            MAX(last_sync_at)::text AS latest_sync_at
     FROM microsoft_connections
     WHERE status = 'connected'`,
  );

  const connectedCount = Number(rows[0]?.connected_count ?? "0");
  return {
    configured: true,
    connected: connectedCount > 0,
    status: connectedCount > 0 ? "Connected" : "Configured",
    missingEnv: [],
    connectedCount,
    latestSyncAt: rows[0]?.latest_sync_at ?? null,
  };
}

export function buildMicrosoftAuthorizeUrl(state: string) {
  const env = requireMicrosoftEnv();
  const url = new URL(getAuthorizeEndpoint(env.tenantId));
  url.searchParams.set("client_id", env.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", env.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", env.scopes.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function handleMicrosoftOAuthCallback(args: {
  userId: number;
  code: string;
}) {
  const env = requireMicrosoftEnv();
  const tokenParams = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: env.redirectUri,
    scope: env.scopes.join(" "),
  });

  const tokens = await exchangeToken(tokenParams, env.tenantId);
  if (!tokens.refresh_token) {
    throw new Error("Microsoft token response did not include refresh_token.");
  }

  const profile = await fetchMicrosoftMe(tokens.access_token);
  await upsertMicrosoftConnection({
    userId: args.userId,
    microsoftUserId: profile.id,
    email: profile.mail || profile.userPrincipalName || null,
    displayName: profile.displayName || null,
    tenantId: env.tenantId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresInSeconds: tokens.expires_in,
    scopes: tokens.scope || env.scopes.join(" "),
  });
}

async function refreshAccessToken(connection: MicrosoftConnectionRow) {
  const env = requireMicrosoftEnv();
  if (!connection.refresh_token_enc) {
    throw new Error("No refresh token stored for Microsoft connection.");
  }
  const refreshToken = decryptToken(connection.refresh_token_enc);

  const tokenParams = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: env.redirectUri,
    scope: env.scopes.join(" "),
  });

  const refreshed = await exchangeToken(tokenParams, env.tenantId);
  const nextRefreshToken = refreshed.refresh_token || refreshToken;
  const tokenExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();

  await query(
    `UPDATE microsoft_connections
     SET access_token_enc = $1,
         refresh_token_enc = $2,
         token_expires_at = $3,
         scopes = $4,
         status = 'connected',
         updated_at = NOW()
     WHERE id = $5`,
    [
      encryptToken(refreshed.access_token),
      encryptToken(nextRefreshToken),
      tokenExpiresAt,
      refreshed.scope || connection.scopes,
      connection.id,
    ],
  );

  return refreshed.access_token;
}

async function getValidAccessToken(userId: number) {
  const connection = await getConnectionByUserId(userId);
  if (!connection || connection.status !== "connected") {
    throw new Error("Microsoft 365 is not connected for this user.");
  }
  if (!connection.access_token_enc) {
    throw new Error("No stored Microsoft access token.");
  }

  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at)
    : null;
  const refreshBefore = Date.now() + TOKEN_REFRESH_SKEW_SECONDS * 1000;
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    return refreshAccessToken(connection);
  }

  if (expiresAt.getTime() <= refreshBefore) {
    return refreshAccessToken(connection);
  }

  return decryptToken(connection.access_token_enc);
}

function parseGraphEventDateTime(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const candidate = (value as { dateTime?: unknown }).dateTime;
  if (typeof candidate !== "string") return null;
  const isoValue = toIsoDateTime(candidate);
  return isoValue ? new Date(isoValue) : null;
}

function getResponseStatus(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const response = (value as { response?: unknown }).response;
  return typeof response === "string" ? response : null;
}

export async function syncOutlookCalendarForUser(
  options: SyncCalendarOptions,
): Promise<SyncCalendarResult> {
  requireMicrosoftEnv();
  await ensureMicrosoftCalendarTables();

  const startedAt = new Date();
  const syncLogRows = await query<{ id: string }>(
    `INSERT INTO calendar_sync_logs
      (user_id, provider, status, message, event_count, started_at, metadata)
     VALUES ($1, $2, 'running', 'Sync started', 0, NOW(), $3::jsonb)
     RETURNING id`,
    [
      options.userId,
      MICROSOFT_PROVIDER,
      JSON.stringify({
        from: options.from.toISOString(),
        to: options.to.toISOString(),
      }),
    ],
  );

  const syncLogId = syncLogRows[0]?.id;

  try {
    const connection = await getConnectionByUserId(options.userId);
    if (!connection) {
      throw new Error("Microsoft 365 is not connected for this user.");
    }

    const accessToken = await getValidAccessToken(options.userId);
    const url = new URL(
      "https://graph.microsoft.com/v1.0/me/calendar/calendarView",
    );
    url.searchParams.set("startDateTime", options.from.toISOString());
    url.searchParams.set("endDateTime", options.to.toISOString());
    url.searchParams.set("$top", "500");
    url.searchParams.set(
      "$select",
      "id,subject,bodyPreview,organizer,location,webLink,start,end,isAllDay,responseStatus",
    );

    const graphResponse = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
      cache: "no-store",
    });

    const graphBody = (await graphResponse.json().catch(() => null)) as {
      value?: Array<Record<string, unknown>>;
      error?: { message?: string };
    } | null;

    if (!graphResponse.ok) {
      const message =
        graphBody?.error?.message ||
        `Microsoft Graph calendar sync failed (${graphResponse.status})`;
      throw new Error(message);
    }

    const events = Array.isArray(graphBody?.value) ? graphBody.value : [];
    const persistedEventIds: string[] = [];

    await withTransaction(async (tx) => {
      for (const event of events) {
        const outlookEventId =
          typeof event.id === "string" ? event.id.trim() : "";
        if (!outlookEventId) continue;

        const start = parseGraphEventDateTime(event.start);
        const end = parseGraphEventDateTime(event.end);
        if (!start || !end) continue;

        persistedEventIds.push(outlookEventId);

        const subject =
          typeof event.subject === "string"
            ? event.subject.slice(0, 1000)
            : null;
        const bodyPreview =
          typeof event.bodyPreview === "string"
            ? event.bodyPreview.slice(0, 5000)
            : null;

        const organizer =
          typeof event.organizer === "object" && event.organizer
            ? (
                event.organizer as {
                  emailAddress?: { name?: string; address?: string };
                }
              ).emailAddress
            : undefined;

        const location =
          typeof event.location === "object" && event.location
            ? (event.location as { displayName?: string }).displayName
            : null;

        const webLink =
          typeof event.webLink === "string" ? event.webLink : null;
        const isAllDay = Boolean(event.isAllDay);
        const responseStatus = getResponseStatus(event.responseStatus);

        await tx(
          `INSERT INTO outlook_calendar_events_cache
            (connection_id, user_id, outlook_event_id, subject, body_preview,
             organizer_name, organizer_email, location, web_link,
             start_time, end_time, is_all_day, response_status, raw, updated_at)
           VALUES
            ($1, $2, $3, $4, $5,
             $6, $7, $8, $9,
             $10, $11, $12, $13, $14::jsonb, NOW())
           ON CONFLICT (user_id, outlook_event_id) DO UPDATE
             SET connection_id = EXCLUDED.connection_id,
                 subject = EXCLUDED.subject,
                 body_preview = EXCLUDED.body_preview,
                 organizer_name = EXCLUDED.organizer_name,
                 organizer_email = EXCLUDED.organizer_email,
                 location = EXCLUDED.location,
                 web_link = EXCLUDED.web_link,
                 start_time = EXCLUDED.start_time,
                 end_time = EXCLUDED.end_time,
                 is_all_day = EXCLUDED.is_all_day,
                 response_status = EXCLUDED.response_status,
                 raw = EXCLUDED.raw,
                 updated_at = NOW()`,
          [
            connection.id,
            options.userId,
            outlookEventId,
            subject,
            bodyPreview,
            organizer?.name || null,
            organizer?.address || null,
            location,
            webLink,
            start.toISOString(),
            end.toISOString(),
            isAllDay,
            responseStatus,
            JSON.stringify(event),
          ],
        );
      }

      if (persistedEventIds.length === 0) {
        await tx(
          `DELETE FROM outlook_calendar_events_cache
           WHERE user_id = $1
             AND end_time >= $2::timestamptz
             AND start_time <= $3::timestamptz`,
          [
            options.userId,
            options.from.toISOString(),
            options.to.toISOString(),
          ],
        );
      } else {
        await tx(
          `DELETE FROM outlook_calendar_events_cache
           WHERE user_id = $1
             AND end_time >= $2::timestamptz
             AND start_time <= $3::timestamptz
             AND NOT (outlook_event_id = ANY($4::text[]))`,
          [
            options.userId,
            options.from.toISOString(),
            options.to.toISOString(),
            persistedEventIds,
          ],
        );
      }

      await tx(
        `UPDATE microsoft_connections
         SET last_sync_at = NOW(),
             status = 'connected',
             updated_at = NOW()
         WHERE id = $1`,
        [connection.id],
      );
    });

    const finishedAt = new Date();
    const message = `Synced ${persistedEventIds.length} Outlook event(s).`;

    if (syncLogId) {
      await query(
        `UPDATE calendar_sync_logs
         SET status = 'success',
             message = $1,
             event_count = $2,
             finished_at = NOW(),
             metadata = $3::jsonb
         WHERE id = $4`,
        [
          message,
          persistedEventIds.length,
          JSON.stringify({
            from: options.from.toISOString(),
            to: options.to.toISOString(),
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
          }),
          syncLogId,
        ],
      );
    }

    return {
      eventCount: persistedEventIds.length,
      from: options.from.toISOString(),
      to: options.to.toISOString(),
      lastSyncAt: finishedAt.toISOString(),
    };
  } catch (error) {
    if (syncLogId) {
      const message =
        error instanceof Error ? error.message : "Calendar sync failed";
      await query(
        `UPDATE calendar_sync_logs
         SET status = 'failed',
             message = $1,
             finished_at = NOW(),
             metadata = $2::jsonb
         WHERE id = $3`,
        [
          message,
          JSON.stringify({
            from: options.from.toISOString(),
            to: options.to.toISOString(),
          }),
          syncLogId,
        ],
      );
    }
    throw error;
  }
}

export async function getCachedOutlookEvents(args: {
  userId: number;
  from: Date;
  to: Date;
}): Promise<OutlookCachedEvent[]> {
  await ensureMicrosoftCalendarTables();
  const rows = await query<CachedEventRow>(
    `SELECT id, outlook_event_id, subject, body_preview,
            organizer_name, organizer_email, location, web_link,
            start_time::text, end_time::text,
            is_all_day, response_status
     FROM outlook_calendar_events_cache
     WHERE user_id = $1
       AND end_time >= $2::timestamptz
       AND start_time <= $3::timestamptz
     ORDER BY start_time ASC`,
    [args.userId, args.from.toISOString(), args.to.toISOString()],
  );

  return rows.map((row) => ({
    id: row.id,
    outlook_event_id: row.outlook_event_id,
    subject: row.subject,
    body_preview: row.body_preview,
    organizer_name: row.organizer_name,
    organizer_email: row.organizer_email,
    location: row.location,
    web_link: row.web_link,
    start_time: row.start_time,
    end_time: row.end_time,
    is_all_day: row.is_all_day,
    response_status: row.response_status,
  }));
}

export function getCurrentWeekRange(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;

  const from = new Date(current);
  from.setDate(current.getDate() + distanceToMonday);
  from.setHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export function parseDateRange(fromRaw: string | null, toRaw: string | null) {
  if (!fromRaw && !toRaw) {
    return getCurrentWeekRange();
  }

  if (!fromRaw || !toRaw) {
    throw new Error(
      "Both from and to query params are required when filtering a custom range.",
    );
  }

  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid date range. Use ISO-8601 from/to values.");
  }

  if (to.getTime() < from.getTime()) {
    throw new Error(
      "Invalid date range. `to` must be greater than or equal to `from`.",
    );
  }

  return { from, to };
}

export async function disconnectMicrosoftGraphConnection(userId: number) {
  await ensureMicrosoftCalendarTables();
  await query(
    `UPDATE microsoft_connections
     SET status = 'disconnected', updated_at = NOW()
     WHERE user_id = $1 AND status = 'connected'`,
    [userId],
  );
}

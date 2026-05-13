import { query } from "@/lib/db";

export type AutomationEventStatus =
  | "pending"
  | "sent"
  | "failed"
  | "config_missing";

export type AutomationEventInput = {
  eventType: string;
  sourceModule: string;
  entityType?: string | null;
  entityId?: string | number | null;
  actorUserId?: number | null;
  payload?: Record<string, unknown>;
  path?: string;
  dispatch?: boolean;
};

export type AutomationEventRow = {
  id: string;
  event_type: string;
  source_module: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  status: AutomationEventStatus;
  n8n_webhook_url: string | null;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
};

const EVENT_WEBHOOK_ENV: Record<string, string> = {
  form_submitted: "N8N_FORM_SUBMITTED_WEBHOOK",
  request_created: "N8N_REQUEST_CREATED_WEBHOOK",
  request_approved: "N8N_REQUEST_CREATED_WEBHOOK",
  request_denied: "N8N_REQUEST_CREATED_WEBHOOK",
  work_order_created: "N8N_WORK_ORDER_CREATED_WEBHOOK",
  work_order_status_changed: "N8N_WORK_ORDER_UPDATED_WEBHOOK",
  task_blocked: "N8N_TASK_OVERDUE_WEBHOOK",
  inventory_low: "N8N_LOW_INVENTORY_WEBHOOK",
  timesheet_submitted: "N8N_TIMESHEET_SUBMITTED_WEBHOOK",
  file_uploaded: "N8N_FILE_UPLOADED_WEBHOOK",
  calendar_block_created: "N8N_CALENDAR_BLOCK_WEBHOOK",
  calendar_block_updated: "N8N_CALENDAR_BLOCK_WEBHOOK",
  calendar_block_deleted: "N8N_CALENDAR_BLOCK_WEBHOOK",
};

export async function createAutomationEvent(input: AutomationEventInput) {
  await ensureAutomationEventsTable();

  const eventType = normalizeRequired(input.eventType, "eventType");
  const sourceModule = normalizeRequired(input.sourceModule, "sourceModule");
  const webhookUrl = getWebhookUrl(eventType);
  const uuidEntityId = normalizeUuid(input.entityId);
  const status: AutomationEventStatus = webhookUrl
    ? "pending"
    : "config_missing";
  const timestamp = new Date().toISOString();
  const payload = {
    ...(input.payload ?? {}),
    actor_user_id: input.actorUserId ?? null,
    entity_id: input.entityId ?? null,
    path: input.path ?? null,
    timestamp,
  };

  const rows = await query<AutomationEventRow>(
    `INSERT INTO automation_events
      (event_type, source_module, entity_type, entity_id, payload, status,
       n8n_webhook_url, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW())
     RETURNING *`,
    [
      eventType,
      sourceModule,
      input.entityType ?? null,
      uuidEntityId,
      JSON.stringify(payload),
      status,
      webhookUrl,
    ],
  );

  const event = rows[0];
  if (input.dispatch !== false && webhookUrl) {
    try {
      await dispatchAutomationEvent(event.id);
    } catch (error) {
      console.error("[automation-events.dispatch]", error);
    }
  }

  return event;
}

export async function safeCreateAutomationEvent(input: AutomationEventInput) {
  try {
    return await createAutomationEvent(input);
  } catch (error) {
    console.error("[automation-events.create]", error);
    return null;
  }
}

export async function dispatchAutomationEvent(eventId: string) {
  await ensureAutomationEventsTable();
  const rows = await query<AutomationEventRow>(
    `SELECT * FROM automation_events WHERE id = $1 LIMIT 1`,
    [eventId],
  );
  const event = rows[0];
  if (!event) throw new Error("Automation event not found");

  if (!event.n8n_webhook_url) {
    const configuredWebhookUrl = getWebhookUrl(event.event_type);
    if (configuredWebhookUrl) {
      event.n8n_webhook_url = configuredWebhookUrl;
      await query(
        `UPDATE automation_events
         SET n8n_webhook_url = $2,
             status = 'pending',
             error_message = NULL,
             processed_at = NULL
         WHERE id = $1`,
        [eventId, configuredWebhookUrl],
      );
    }
  }

  if (!event.n8n_webhook_url) {
    await markAutomationFailed(
      eventId,
      "No n8n webhook URL configured",
      "config_missing",
    );
    return null;
  }

  try {
    const response = await dispatchToN8n(event);
    await markAutomationSent(eventId, response);
    return response;
  } catch (error) {
    await markAutomationFailed(eventId, error);
    return null;
  }
}

export async function dispatchToN8n(event: AutomationEventRow) {
  if (!event.n8n_webhook_url) {
    throw new Error("No n8n webhook URL configured");
  }

  const response = await fetch(event.n8n_webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SECRET
        ? { "x-diversified-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify({
      id: event.id,
      event_type: event.event_type,
      source_module: event.source_module,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      payload: event.payload,
      created_at: event.created_at,
    }),
    signal: AbortSignal.timeout(8000),
  });

  const body = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: body.slice(0, 4000),
  };
}

export async function markAutomationSent(
  eventId: string,
  response: { ok: boolean; status: number; body: string },
) {
  const nextStatus: AutomationEventStatus = response.ok ? "sent" : "failed";
  await query(
    `UPDATE automation_events
     SET status = $2,
         response_status = $3,
         response_body = $4,
         error_message = $5,
         processed_at = NOW()
     WHERE id = $1`,
    [
      eventId,
      nextStatus,
      response.status,
      response.body,
      response.ok ? null : `n8n returned HTTP ${response.status}`,
    ],
  );
}

export async function markAutomationFailed(
  eventId: string,
  error: unknown,
  status: AutomationEventStatus = "failed",
) {
  const message = error instanceof Error ? error.message : String(error);
  await query(
    `UPDATE automation_events
     SET status = $2,
         error_message = $3,
         processed_at = NOW()
     WHERE id = $1`,
    [eventId, status, message.slice(0, 4000)],
  );
}

export async function getAutomationStatus() {
  await ensureAutomationEventsTable();
  const rows = await query<{ status: AutomationEventStatus; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM automation_events
     GROUP BY status`,
  );
  const counts = {
    pending: 0,
    sent: 0,
    failed: 0,
    config_missing: 0,
  } satisfies Record<AutomationEventStatus, number>;

  for (const row of rows) {
    if (row.status in counts) counts[row.status] = Number(row.count);
  }

  const [lastSuccessfulEvent] = await query<AutomationEventRow>(
    `SELECT * FROM automation_events
     WHERE status = 'sent'
     ORDER BY processed_at DESC NULLS LAST, created_at DESC
     LIMIT 1`,
  );
  const [lastFailedEvent] = await query<AutomationEventRow>(
    `SELECT * FROM automation_events
     WHERE status IN ('failed', 'config_missing')
     ORDER BY processed_at DESC NULLS LAST, created_at DESC
     LIMIT 1`,
  );

  const configuredWebhooks = getConfiguredWebhookNames();
  const genericWebhookConfigured = Boolean(process.env.N8N_WEBHOOK_URL);
  const anyWebhookConfigured =
    genericWebhookConfigured || configuredWebhooks.length > 0;

  return {
    checkedAt: new Date().toISOString(),
    n8n: {
      baseUrl: process.env.N8N_BASE_URL || "Not configured",
      genericWebhookConfigured,
      configuredWebhooks,
      webhookSecretConfigured: Boolean(process.env.N8N_WEBHOOK_SECRET),
      anyWebhookConfigured,
    },
    counts,
    healthState: !anyWebhookConfigured
      ? "config_missing"
      : counts.failed > 0
        ? "degraded"
        : "healthy",
    lastSuccessfulEvent: lastSuccessfulEvent ?? null,
    lastFailedEvent: lastFailedEvent ?? null,
  };
}

export async function getRecentAutomationEvents(
  filters: {
    status?: string | null;
    eventType?: string | null;
    sourceModule?: string | null;
    limit?: number;
  } = {},
) {
  await ensureAutomationEventsTable();
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }
  if (filters.eventType) {
    values.push(filters.eventType);
    clauses.push(`event_type = $${values.length}`);
  }
  if (filters.sourceModule) {
    values.push(filters.sourceModule);
    clauses.push(`source_module = $${values.length}`);
  }

  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  values.push(limit);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return query<AutomationEventRow>(
    `SELECT * FROM automation_events
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values,
  );
}

export function getWebhookUrl(eventType: string) {
  const specificEnv = EVENT_WEBHOOK_ENV[eventType];
  return (
    (specificEnv ? process.env[specificEnv] : undefined) ||
    process.env.N8N_WEBHOOK_URL ||
    null
  );
}

function getConfiguredWebhookNames() {
  const names = Object.entries(EVENT_WEBHOOK_ENV)
    .filter(([, envName]) => Boolean(process.env[envName]))
    .map(([eventType]) => eventType);
  if (process.env.N8N_WEBHOOK_URL) names.unshift("generic");
  return names;
}

async function ensureAutomationEventsTable() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await query(`CREATE TABLE IF NOT EXISTS automation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    source_module TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    n8n_webhook_url TEXT,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
  )`);
  await query(
    `CREATE INDEX IF NOT EXISTS idx_automation_events_status_created_at
     ON automation_events (status, created_at DESC)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_automation_events_type_source
     ON automation_events (event_type, source_module)`,
  );
}

function normalizeRequired(value: string, label: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]/g, "_");
  if (!normalized) throw new Error(`${label} is required`);
  return normalized.slice(0, 120);
}

function normalizeUuid(value: string | number | null | undefined) {
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

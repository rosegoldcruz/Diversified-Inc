import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export type AuditLogInput = {
  actorUserId?: string | number | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | number | null;
  beforeData?: unknown;
  afterData?: unknown;
  request?: NextRequest;
};

export type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  actor_user_id_text: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_id_text: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export async function createAuditLog(input: AuditLogInput) {
  await ensureAuditLogsTable();

  const actorUserId = normalizeUuid(input.actorUserId);
  const entityId = normalizeUuid(input.entityId);
  const actorUserIdText =
    input.actorUserId == null ? null : String(input.actorUserId);
  const entityIdText = input.entityId == null ? null : String(input.entityId);

  const rows = await query<AuditLogRow>(
    `INSERT INTO audit_logs
      (actor_user_id, actor_user_id_text, action, module, entity_type, entity_id,
       entity_id_text, before_data, after_data, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, NOW())
     RETURNING *`,
    [
      actorUserId,
      actorUserIdText,
      normalizeLabel(input.action, "action"),
      normalizeLabel(input.module, "module"),
      input.entityType ?? null,
      entityId,
      entityIdText,
      JSON.stringify(input.beforeData ?? null),
      JSON.stringify(input.afterData ?? null),
      getIpAddress(input.request),
      input.request?.headers.get("user-agent")?.slice(0, 1000) ?? null,
    ],
  );

  return rows[0];
}

export async function safeCreateAuditLog(input: AuditLogInput) {
  try {
    return await createAuditLog(input);
  } catch (error) {
    console.error("[audit-log.create]", error);
    return null;
  }
}

export async function getAuditLogs(filters: {
  module?: string | null;
  action?: string | null;
  entityType?: string | null;
  actorUserId?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}) {
  await ensureAuditLogsTable();

  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters.module) {
    values.push(filters.module);
    clauses.push(`module = $${values.length}`);
  }
  if (filters.action) {
    values.push(filters.action);
    clauses.push(`action = $${values.length}`);
  }
  if (filters.entityType) {
    values.push(filters.entityType);
    clauses.push(`entity_type = $${values.length}`);
  }
  if (filters.actorUserId) {
    const actorUuid = normalizeUuid(filters.actorUserId);
    values.push(filters.actorUserId);
    if (actorUuid) {
      values.push(actorUuid);
      clauses.push(
        `(actor_user_id_text = $${values.length - 1} OR actor_user_id = $${values.length})`,
      );
    } else {
      clauses.push(`actor_user_id_text = $${values.length}`);
    }
  }
  if (filters.from) {
    values.push(filters.from);
    clauses.push(`created_at >= $${values.length}::timestamptz`);
  }
  if (filters.to) {
    values.push(filters.to);
    clauses.push(`created_at <= $${values.length}::timestamptz`);
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  values.push(limit);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return query<AuditLogRow>(
    `SELECT id, actor_user_id, actor_user_id_text, action, module, entity_type,
            entity_id, entity_id_text, before_data, after_data, ip_address,
            user_agent, created_at
     FROM audit_logs
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values,
  );
}

async function ensureAuditLogsTable() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID,
    actor_user_id_text TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    entity_id_text TEXT,
    before_data JSONB,
    after_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_user_id_text TEXT`,
  );
  await query(
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id_text TEXT`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id_text ON audit_logs (actor_user_id_text)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action_created_at ON audit_logs (module, action, created_at DESC)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_text ON audit_logs (entity_type, entity_id_text)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC)`,
  );
}

function normalizeLabel(value: string, label: string) {
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

function getIpAddress(request?: NextRequest) {
  if (!request) return null;
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

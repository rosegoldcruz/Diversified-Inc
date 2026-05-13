import { query } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  SETTINGS_METADATA,
  type SettingCategory,
  type SettingKey,
  type SystemSettingValue,
} from "@/lib/settings-config";

export type SystemSettingRow = {
  id: number;
  key: SettingKey;
  value: SystemSettingValue;
  category: SettingCategory;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  created_at: string;
};

let settingsTablesEnsured = false;

export async function ensureSettingsTables() {
  if (settingsTablesEnsured) return;

  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id BIGSERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      category TEXT NOT NULL,
      description TEXT,
      is_public BOOLEAN NOT NULL DEFAULT false,
      updated_by UUID NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_user_id UUID NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  settingsTablesEnsured = true;
}

export async function seedDefaultSettings() {
  await ensureSettingsTables();

  const keys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];
  for (const key of keys) {
    const meta = SETTINGS_METADATA[key];
    await query(
      `
        INSERT INTO system_settings (key, value, category, description, is_public)
        VALUES ($1, $2::jsonb, $3, $4, false)
        ON CONFLICT (key) DO NOTHING
      `,
      [
        key,
        JSON.stringify(DEFAULT_SETTINGS[key]),
        meta.category,
        meta.description,
      ],
    );
  }
}

export async function getAllSettings() {
  await seedDefaultSettings();

  const rows = await query<SystemSettingRow>(`
    SELECT id, key, value, category, description, is_public, updated_at, created_at
    FROM system_settings
    ORDER BY category, key
  `);

  const byKey = rows.reduce(
    (acc, row) => {
      acc[row.key] = row.value;
      return acc;
    },
    {} as Record<SettingKey, SystemSettingValue>,
  );

  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    if (!(key in byKey)) {
      byKey[key] = DEFAULT_SETTINGS[key];
    }
  }

  return { rows, byKey };
}

export async function getSettingByKey(key: SettingKey) {
  await seedDefaultSettings();

  const rows = await query<SystemSettingRow>(
    `
      SELECT id, key, value, category, description, is_public, updated_at, created_at
      FROM system_settings
      WHERE key = $1
      LIMIT 1
    `,
    [key],
  );

  return rows[0] ?? null;
}

export async function upsertSetting(args: {
  key: SettingKey;
  value: SystemSettingValue;
  category?: SettingCategory;
  description?: string;
}) {
  await seedDefaultSettings();

  const meta = SETTINGS_METADATA[args.key];
  const category = args.category ?? meta.category;
  const description = args.description ?? meta.description;

  const rows = await query<SystemSettingRow>(
    `
      INSERT INTO system_settings (key, value, category, description, is_public, updated_at)
      VALUES ($1, $2::jsonb, $3, $4, false, NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        updated_at = NOW()
      RETURNING id, key, value, category, description, is_public, updated_at, created_at
    `,
    [args.key, JSON.stringify(args.value), category, description],
  );

  return rows[0];
}

export async function appendAuditLog(args: {
  action: string;
  module: string;
  recordId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await ensureSettingsTables();

  await query(
    `
      INSERT INTO system_audit_logs (action, module, record_id, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      args.action,
      args.module,
      args.recordId ?? null,
      JSON.stringify(args.metadata ?? {}),
    ],
  );
}

export async function getAuditLogs(limit = 20) {
  await ensureSettingsTables();

  const cappedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(100, Math.floor(limit)))
    : 20;

  return query(
    `
      SELECT id, actor_user_id, action, module, record_id, metadata, created_at
      FROM system_audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [cappedLimit],
  );
}

export function getSafeAutomationMode(
  value: SystemSettingValue | undefined,
): "disabled" | "test" | "live" {
  if (value === "disabled" || value === "test" || value === "live") {
    return value as "disabled" | "test" | "live";
  }

  return "disabled";
}

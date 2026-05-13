import { query } from "@/lib/db";
import { ValidationError } from "@/lib/validators";

const BLOCK_TYPES = new Set([
  "task_work",
  "meeting",
  "admin",
  "follow_up",
  "review",
  "work_order",
  "other",
]);

export type CalendarBlockRow = {
  id: string;
  title: string;
  description: string | null;
  block_type: string;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_to_employee_id: number | null;
  assigned_to_name: string | null;
  linked_task_id: string | null;
  linked_task_int_id: number | null;
  linked_work_order_id: string | null;
  linked_work_order_int_id: number | null;
  company_division: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  notes: string | null;
  created_by: string | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export async function ensureCalendarBlocksTable() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await query(`CREATE TABLE IF NOT EXISTS calendar_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    block_type TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    priority TEXT,
    assigned_to UUID,
    assigned_to_employee_id INTEGER,
    linked_task_id UUID,
    linked_task_int_id INTEGER,
    linked_work_order_id UUID,
    linked_work_order_int_id INTEGER,
    company_division TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID,
    created_by_user_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(
    `ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS assigned_to_employee_id INTEGER`,
  );
  await query(
    `ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS linked_task_int_id INTEGER`,
  );
  await query(
    `ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS linked_work_order_int_id INTEGER`,
  );
  await query(
    `ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_calendar_blocks_start_time ON calendar_blocks (start_time)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_calendar_blocks_assigned_employee_start_time ON calendar_blocks (assigned_to_employee_id, start_time)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_calendar_blocks_status ON calendar_blocks (status)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_calendar_blocks_linked_task_int ON calendar_blocks (linked_task_int_id)`,
  );
}

export function normalizeBlockType(value: unknown) {
  const normalized =
    typeof value === "string"
      ? value
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_")
      : "";
  if (!BLOCK_TYPES.has(normalized)) {
    throw new ValidationError(
      `block_type must be one of: ${Array.from(BLOCK_TYPES).join(", ")}`,
    );
  }
  return normalized;
}

export function optionalString(value: unknown, maxLength: number) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return String(value).slice(0, maxLength);
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function optionalInteger(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && normalizeUuid(value)) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${label} must be a positive integer`);
  }
  return parsed;
}

export function requireDateTime(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${label} is required`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${label} must be a valid date/time`);
  }
  return date;
}

export function normalizeUuid(value: unknown) {
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

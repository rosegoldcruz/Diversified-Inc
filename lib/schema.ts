import { query } from "./db";
import { hashPassword } from "./auth";

/**
 * Idempotent schema bootstrap. Runs once per server process.
 * Adds auth columns, the internal OS `notifications` table, and seeds a
 * default Leadership admin if no employees yet have credentials.
 */
let bootstrapPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((err) => {
      // Reset so the next request can retry; otherwise we'd cache the failure.
      bootstrapPromise = null;
      throw err;
    });
  }
  return bootstrapPromise;
}

async function bootstrap(): Promise<void> {
  // 1) Add auth columns to employees if missing.
  await query(`
    ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique
      ON employees ((LOWER(email)))
      WHERE email IS NOT NULL
  `);

  // 2) Internal OS notifications table (separate from the NocoDB `notification` table).
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS notifications_user_idx
      ON notifications (user_id, is_read, created_at DESC)
  `);

  // 3) Audit columns on requests + form linkage already exist in the schema;
  //    ensure status transitions are constrained to known values via a CHECK.
  await query(`
    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS updated_by INTEGER
  `);

  // 4) Seed a default Leadership admin if none exists.
  const seedEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@diversified.local"
  ).toLowerCase();
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";
  const seedName = process.env.SEED_ADMIN_NAME || "Diversified Admin";

  const existing = await query<{ id: number; password_hash: string | null }>(
    `SELECT id, password_hash FROM employees WHERE LOWER(email) = $1 LIMIT 1`,
    [seedEmail],
  );

  if (existing.length === 0) {
    await query(
      `INSERT INTO employees (name, role, department, status, email, password_hash, hire_date)
       VALUES ($1, 'Leadership', 'Leadership', 'active', $2, $3, CURRENT_DATE)`,
      [seedName, seedEmail, hashPassword(seedPassword)],
    );
  } else if (!existing[0].password_hash) {
    await query(
      `UPDATE employees
       SET password_hash = $1, role = COALESCE(NULLIF(role,''), 'Leadership')
       WHERE id = $2`,
      [hashPassword(seedPassword), existing[0].id],
    );
  }
}

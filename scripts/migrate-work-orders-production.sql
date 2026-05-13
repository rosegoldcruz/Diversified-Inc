-- Migration: production work order create/update support
-- Apply with: psql "$DATABASE_URL" -f scripts/migrate-work-orders-production.sql

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'General',
  division TEXT NOT NULL DEFAULT 'Operations',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES employees(id) ON DELETE SET NULL
);

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS division TEXT NOT NULL DEFAULT 'Operations',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS owner INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES employees(id) ON DELETE SET NULL;

UPDATE work_orders
SET
  division = COALESCE(NULLIF(division, ''), 'Operations'),
  status = CASE LOWER(COALESCE(status, 'open'))
    WHEN 'pending' THEN 'waiting'
    WHEN 'complete' THEN 'completed'
    WHEN 'closed' THEN 'completed'
    WHEN 'canceled' THEN 'cancelled'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'scheduled' THEN 'scheduled'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'in progress' THEN 'in_progress'
    WHEN 'waiting' THEN 'waiting'
    WHEN 'completed' THEN 'completed'
    ELSE 'open'
  END,
  priority = CASE LOWER(COALESCE(priority, 'medium'))
    WHEN 'urgent' THEN 'urgent'
    WHEN 'high' THEN 'high'
    WHEN 'low' THEN 'low'
    ELSE 'medium'
  END;

ALTER TABLE work_orders
  DROP CONSTRAINT IF EXISTS work_orders_status_check,
  ADD CONSTRAINT work_orders_status_check
    CHECK (status IN ('open', 'scheduled', 'in_progress', 'waiting', 'completed', 'cancelled'));

ALTER TABLE work_orders
  DROP CONSTRAINT IF EXISTS work_orders_priority_check,
  ADD CONSTRAINT work_orders_priority_check
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX IF NOT EXISTS work_orders_status_idx ON work_orders (status);
CREATE INDEX IF NOT EXISTS work_orders_due_date_idx ON work_orders (due_date);
CREATE INDEX IF NOT EXISTS work_orders_owner_idx ON work_orders (owner);

CREATE OR REPLACE FUNCTION set_work_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON work_orders;
CREATE TRIGGER trg_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION set_work_orders_updated_at();

-- Migration: SOP Engine v1 backend tables
-- Apply with: psql "$DATABASE_URL" -f scripts/migrate-sop-engine.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Extend the existing SOP template table. Do not recreate it; legacy routes
-- already depend on sops.id, title, description, category, owner, status,
-- version, and last_updated.
ALTER TABLE sops
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS created_by INTEGER,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE sops
SET
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL
   OR updated_at IS NULL;

CREATE TABLE IF NOT EXISTS sop_steps (
  id SERIAL PRIMARY KEY,
  sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  required_role TEXT,
  requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_minutes INTEGER,
  branch_condition JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sop_steps_step_order_positive CHECK (step_order > 0),
  CONSTRAINT sop_steps_estimated_minutes_positive CHECK (estimated_minutes IS NULL OR estimated_minutes > 0)
);

ALTER TABLE sop_steps
  ADD COLUMN IF NOT EXISTS sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS step_order INTEGER,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS required_role TEXT,
  ADD COLUMN IF NOT EXISTS requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS branch_condition JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_steps_step_order_positive'
  ) THEN
    ALTER TABLE sop_steps
      ADD CONSTRAINT sop_steps_step_order_positive CHECK (step_order > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_steps_estimated_minutes_positive'
  ) THEN
    ALTER TABLE sop_steps
      ADD CONSTRAINT sop_steps_estimated_minutes_positive CHECK (estimated_minutes IS NULL OR estimated_minutes > 0) NOT VALID;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_steps_sop_order
  ON sop_steps (sop_id, step_order);

CREATE INDEX IF NOT EXISTS idx_sop_steps_sop_id
  ON sop_steps (sop_id);

CREATE TABLE IF NOT EXISTS sop_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id INTEGER NOT NULL REFERENCES sops(id) ON DELETE RESTRICT,
  assigned_to INTEGER REFERENCES employees(id),
  started_by INTEGER NOT NULL REFERENCES employees(id),
  current_step_id INTEGER REFERENCES sop_steps(id),
  status TEXT NOT NULL DEFAULT 'running',
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  wait_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  blocked_reason TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sop_runs_status_check CHECK (status IN ('not_started', 'running', 'waiting', 'blocked', 'completed', 'failed', 'canceled')),
  CONSTRAINT sop_runs_revision_positive CHECK (revision > 0)
);

ALTER TABLE sop_runs
  ADD COLUMN IF NOT EXISTS sop_id INTEGER REFERENCES sops(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS started_by INTEGER REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS current_step_id INTEGER REFERENCES sop_steps(id),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'running',
  ADD COLUMN IF NOT EXISTS state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS wait_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_runs_status_check'
  ) THEN
    ALTER TABLE sop_runs
      ADD CONSTRAINT sop_runs_status_check CHECK (status IN ('not_started', 'running', 'waiting', 'blocked', 'completed', 'failed', 'canceled')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_runs_revision_positive'
  ) THEN
    ALTER TABLE sop_runs
      ADD CONSTRAINT sop_runs_revision_positive CHECK (revision > 0) NOT VALID;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_sop_runs_status_updated
  ON sop_runs (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sop_runs_sop_id
  ON sop_runs (sop_id);

CREATE INDEX IF NOT EXISTS idx_sop_runs_assigned_to
  ON sop_runs (assigned_to);

CREATE TABLE IF NOT EXISTS sop_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_run_id UUID NOT NULL REFERENCES sop_runs(id) ON DELETE CASCADE,
  sop_step_id INTEGER NOT NULL REFERENCES sop_steps(id) ON DELETE RESTRICT,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  evidence_url TEXT,
  completed_by INTEGER REFERENCES employees(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sop_run_steps_status_check CHECK (status IN ('pending', 'in_progress', 'waiting', 'blocked', 'completed', 'skipped')),
  CONSTRAINT sop_run_steps_step_order_positive CHECK (step_order > 0)
);

ALTER TABLE sop_run_steps
  ADD COLUMN IF NOT EXISTS sop_run_id UUID REFERENCES sop_runs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sop_step_id INTEGER REFERENCES sop_steps(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS step_order INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_run_steps_status_check'
  ) THEN
    ALTER TABLE sop_run_steps
      ADD CONSTRAINT sop_run_steps_status_check CHECK (status IN ('pending', 'in_progress', 'waiting', 'blocked', 'completed', 'skipped')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_run_steps_step_order_positive'
  ) THEN
    ALTER TABLE sop_run_steps
      ADD CONSTRAINT sop_run_steps_step_order_positive CHECK (step_order > 0) NOT VALID;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sop_run_steps_unique_step
  ON sop_run_steps (sop_run_id, sop_step_id);

CREATE INDEX IF NOT EXISTS idx_sop_run_steps_run_order
  ON sop_run_steps (sop_run_id, step_order);

CREATE INDEX IF NOT EXISTS idx_sop_run_steps_status
  ON sop_run_steps (status);

CREATE TABLE IF NOT EXISTS sop_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_run_id UUID NOT NULL REFERENCES sop_runs(id) ON DELETE CASCADE,
  sop_step_id INTEGER NOT NULL REFERENCES sop_steps(id) ON DELETE RESTRICT,
  requested_by INTEGER NOT NULL REFERENCES employees(id),
  approver_id INTEGER REFERENCES employees(id),
  status TEXT NOT NULL DEFAULT 'pending',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT sop_approvals_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE sop_approvals
  ADD COLUMN IF NOT EXISTS sop_run_id UUID REFERENCES sop_runs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sop_step_id INTEGER REFERENCES sop_steps(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS requested_by INTEGER REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS approver_id INTEGER REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS comment TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sop_approvals_status_check'
  ) THEN
    ALTER TABLE sop_approvals
      ADD CONSTRAINT sop_approvals_status_check CHECK (status IN ('pending', 'approved', 'rejected')) NOT VALID;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_sop_approvals_run_status
  ON sop_approvals (sop_run_id, status);

CREATE INDEX IF NOT EXISTS idx_sop_approvals_status_created
  ON sop_approvals (status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sop_steps_updated_at'
  ) THEN
    CREATE TRIGGER trg_sop_steps_updated_at
      BEFORE UPDATE ON sop_steps
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sop_runs_updated_at'
  ) THEN
    CREATE TRIGGER trg_sop_runs_updated_at
      BEFORE UPDATE ON sop_runs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sop_run_steps_updated_at'
  ) THEN
    CREATE TRIGGER trg_sop_run_steps_updated_at
      BEFORE UPDATE ON sop_run_steps
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
-- Migration: internal OS capabilities schema foundation
-- Apply with: psql "$DATABASE_URL" -f scripts/migrate-internal-os-capabilities.sql
-- Purpose: files, documents extensions, automation events, audit logs, calendar blocks, and search indexes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- files: canonical UUID-backed file metadata table.
-- Existing file_records remains untouched for legacy app compatibility.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  category TEXT,
  linked_entity_type TEXT,
  linked_entity_id UUID,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS original_name TEXT,
  ADD COLUMN IF NOT EXISTS stored_name TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS linked_entity_type TEXT,
  ADD COLUMN IF NOT EXISTS linked_entity_id UUID,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_files_stored_name_unique
  ON files (stored_name);

CREATE INDEX IF NOT EXISTS idx_files_original_name_lower
  ON files (LOWER(original_name));

CREATE INDEX IF NOT EXISTS idx_files_category
  ON files (category);

CREATE INDEX IF NOT EXISTS idx_files_linked_entity
  ON files (linked_entity_type, linked_entity_id);

CREATE INDEX IF NOT EXISTS idx_files_uploaded_by
  ON files (uploaded_by);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_files_updated_at'
  ) THEN
    CREATE TRIGGER trg_files_updated_at
      BEFORE UPDATE ON files
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- documents: create if missing, otherwise extend existing document table safely.
-- Existing integer primary keys are preserved if the table already exists.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_id UUID REFERENCES files(id),
  status TEXT DEFAULT 'draft',
  category TEXT,
  owner_id UUID,
  company_division TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES files(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD COLUMN IF NOT EXISTS company_division TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE documents
SET
  title = COALESCE(NULLIF(title, ''), 'Untitled document'),
  status = COALESCE(NULLIF(status, ''), 'draft'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE title IS NULL
   OR title = ''
   OR status IS NULL
   OR status = ''
   OR created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE documents
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_documents_status
  ON documents (status);

CREATE INDEX IF NOT EXISTS idx_documents_category
  ON documents (category);

CREATE INDEX IF NOT EXISTS idx_documents_file_id
  ON documents (file_id);

CREATE INDEX IF NOT EXISTS idx_documents_owner_id
  ON documents (owner_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_documents_updated_at_os'
  ) THEN
    CREATE TRIGGER trg_documents_updated_at_os
      BEFORE UPDATE ON documents
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- automation_events: durable queue/log for n8n and internal workflow events.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS automation_events (
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
);

ALTER TABLE automation_events
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS source_module TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS response_status INTEGER,
  ADD COLUMN IF NOT EXISTS response_body TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE automation_events
  ALTER COLUMN payload SET DEFAULT '{}'::jsonb,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_automation_events_status_created_at
  ON automation_events (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_events_type_source
  ON automation_events (event_type, source_module);

CREATE INDEX IF NOT EXISTS idx_automation_events_entity
  ON automation_events (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_automation_events_processed_at
  ON automation_events (processed_at DESC);

-- -----------------------------------------------------------------------------
-- audit_logs: cross-module immutable audit trail.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_user_id UUID,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS before_data JSONB,
  ADD COLUMN IF NOT EXISTS after_data JSONB,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE audit_logs
  ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id
  ON audit_logs (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action_created_at
  ON audit_logs (module, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

-- -----------------------------------------------------------------------------
-- calendar_blocks: projection calendar records, created only if absent.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  block_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  priority TEXT,
  assigned_to UUID,
  linked_task_id UUID,
  linked_work_order_id UUID,
  company_division TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_blocks
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS block_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS priority TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS linked_task_id UUID,
  ADD COLUMN IF NOT EXISTS linked_work_order_id UUID,
  ADD COLUMN IF NOT EXISTS company_division TEXT,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE calendar_blocks
  ALTER COLUMN status SET DEFAULT 'scheduled',
  ALTER COLUMN all_day SET DEFAULT FALSE,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE calendar_blocks
  DROP CONSTRAINT IF EXISTS calendar_blocks_time_check,
  ADD CONSTRAINT calendar_blocks_time_check
    CHECK (end_time > start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_start_time
  ON calendar_blocks (start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_assigned_to_start_time
  ON calendar_blocks (assigned_to, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_status
  ON calendar_blocks (status);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_linked_task
  ON calendar_blocks (linked_task_id);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_linked_work_order
  ON calendar_blocks (linked_work_order_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_calendar_blocks_updated_at'
  ) THEN
    CREATE TRIGGER trg_calendar_blocks_updated_at
      BEFORE UPDATE ON calendar_blocks
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- Search and filter indexes for existing operational modules.
-- Conditional blocks avoid errors if a legacy table/column is absent.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.tasks') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'title') THEN
      CREATE INDEX IF NOT EXISTS idx_tasks_title_lower ON tasks (LOWER(title));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'priority') THEN
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'assigned_to') THEN
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_status_priority_assigned_to ON tasks (status, priority, assigned_to);
    END IF;
  END IF;

  IF to_regclass('public.requests') IS NOT NULL THEN
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS request_number TEXT;
    ALTER TABLE requests ADD COLUMN IF NOT EXISTS assignee UUID;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'request_id') THEN
      UPDATE requests SET request_number = request_id WHERE request_number IS NULL AND request_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_requests_request_id ON requests (request_id);
    END IF;

    CREATE INDEX IF NOT EXISTS idx_requests_request_number ON requests (request_number);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests (status);
    CREATE INDEX IF NOT EXISTS idx_requests_category ON requests (category);
    CREATE INDEX IF NOT EXISTS idx_requests_assignee ON requests (assignee);

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'assigned_reviewer') THEN
      CREATE INDEX IF NOT EXISTS idx_requests_assigned_reviewer ON requests (assigned_reviewer);
    END IF;
  END IF;

  IF to_regclass('public.work_orders') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'assigned_to') THEN
      CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders (assigned_to);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'work_orders' AND column_name = 'owner') THEN
      CREATE INDEX IF NOT EXISTS idx_work_orders_owner ON work_orders (owner);
    END IF;
    CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders (status);
    CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders (priority);
    CREATE INDEX IF NOT EXISTS idx_work_orders_status_priority ON work_orders (status, priority);
  END IF;

  IF to_regclass('public.employees') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'name') THEN
      CREATE INDEX IF NOT EXISTS idx_employees_name_lower ON employees (LOWER(name));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'email') THEN
      CREATE INDEX IF NOT EXISTS idx_employees_email_lower ON employees (LOWER(email));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'department') THEN
      CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department);
    END IF;
  END IF;

  IF to_regclass('public.sops') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sops' AND column_name = 'title') THEN
      CREATE INDEX IF NOT EXISTS idx_sops_title_lower ON sops (LOWER(title));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sops' AND column_name = 'category') THEN
      CREATE INDEX IF NOT EXISTS idx_sops_category ON sops (category);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sops' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_sops_status ON sops (status);
    END IF;
  END IF;
END;
$$;

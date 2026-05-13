-- Migration: production file upload/download metadata
-- Apply with: psql "$DATABASE_URL" -f scripts/migrate-files-production.sql

CREATE TABLE IF NOT EXISTS file_records (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT,
  stored_name TEXT,
  storage_path TEXT,
  category TEXT NOT NULL DEFAULT 'document',
  mime_type TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_by TEXT NOT NULL,
  uploaded_by_user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  url TEXT NOT NULL DEFAULT '',
  linked_entity_type TEXT,
  linked_entity_id INTEGER,
  linked_task_id INTEGER,
  linked_request_id INTEGER,
  linked_work_order_id INTEGER,
  linked_sop_id INTEGER
);

ALTER TABLE file_records
  ADD COLUMN IF NOT EXISTS original_name TEXT,
  ADD COLUMN IF NOT EXISTS stored_name TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'document',
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploaded_by TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by_user_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linked_entity_type TEXT,
  ADD COLUMN IF NOT EXISTS linked_entity_id INTEGER,
  ADD COLUMN IF NOT EXISTS linked_task_id INTEGER,
  ADD COLUMN IF NOT EXISTS linked_request_id INTEGER,
  ADD COLUMN IF NOT EXISTS linked_work_order_id INTEGER,
  ADD COLUMN IF NOT EXISTS linked_sop_id INTEGER;

UPDATE file_records
SET
  original_name = COALESCE(original_name, name),
  uploaded_by = COALESCE(NULLIF(uploaded_by, ''), 'Unknown'),
  created_at = COALESCE(created_at, uploaded_at, NOW()),
  uploaded_at = COALESCE(uploaded_at, created_at, NOW()),
  category = COALESCE(NULLIF(category, ''), 'document'),
  url = COALESCE(url, '');

ALTER TABLE file_records
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN category SET DEFAULT 'document',
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN size_bytes SET DEFAULT 0,
  ALTER COLUMN size_bytes SET NOT NULL,
  ALTER COLUMN uploaded_by SET NOT NULL,
  ALTER COLUMN uploaded_at SET DEFAULT NOW(),
  ALTER COLUMN uploaded_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN url SET DEFAULT '',
  ALTER COLUMN url SET NOT NULL;

ALTER TABLE file_records
  DROP CONSTRAINT IF EXISTS file_records_linked_entity_check,
  ADD CONSTRAINT file_records_linked_entity_check
    CHECK (
      (linked_entity_type IS NULL AND linked_entity_id IS NULL)
      OR
      (linked_entity_type IN ('task', 'request', 'work_order', 'sop', 'inventory', 'employee', 'document')
       AND linked_entity_id IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS file_records_created_at_idx
  ON file_records (created_at DESC);

CREATE INDEX IF NOT EXISTS file_records_linked_entity_idx
  ON file_records (linked_entity_type, linked_entity_id);

CREATE UNIQUE INDEX IF NOT EXISTS file_records_stored_name_unique
  ON file_records (stored_name)
  WHERE stored_name IS NOT NULL;

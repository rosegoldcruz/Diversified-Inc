-- Migration: production internal documents and eSign records
-- Apply with: psql "$DATABASE_URL" -f scripts/migrate-documents-production.sql

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  document_type TEXT NOT NULL DEFAULT 'document',
  entity_type TEXT,
  entity_id INTEGER,
  title TEXT NOT NULL,
  file_path TEXT,
  file_url TEXT,
  storage_url TEXT,
  file_size BIGINT,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  status TEXT NOT NULL DEFAULT 'draft',
  sign_status TEXT NOT NULL DEFAULT 'unsigned',
  generated_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  signed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'document',
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id INTEGER,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS storage_url TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS sign_status TEXT NOT NULL DEFAULT 'unsigned',
  ADD COLUMN IF NOT EXISTS generated_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signature_data JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE documents
SET
  title = COALESCE(NULLIF(title, ''), 'Untitled document'),
  status = CASE LOWER(COALESCE(status, 'draft'))
    WHEN 'generated' THEN 'generated'
    WHEN 'sent' THEN 'sent'
    WHEN 'viewed' THEN 'viewed'
    WHEN 'archived' THEN 'archived'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'canceled' THEN 'cancelled'
    ELSE 'draft'
  END,
  sign_status = CASE LOWER(COALESCE(sign_status, 'unsigned'))
    WHEN 'pending_signature' THEN 'pending_signature'
    WHEN 'pending signature' THEN 'pending_signature'
    WHEN 'partially_signed' THEN 'partially_signed'
    WHEN 'partially signed' THEN 'partially_signed'
    WHEN 'signed' THEN 'signed'
    WHEN 'declined' THEN 'declined'
    WHEN 'expired' THEN 'expired'
    ELSE 'unsigned'
  END,
  metadata = COALESCE(metadata, '{}'::jsonb);

ALTER TABLE documents
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN metadata SET NOT NULL;

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_status_check,
  ADD CONSTRAINT documents_status_check
    CHECK (status IN ('draft', 'generated', 'sent', 'viewed', 'archived', 'cancelled'));

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_sign_status_check,
  ADD CONSTRAINT documents_sign_status_check
    CHECK (sign_status IN ('unsigned', 'pending_signature', 'partially_signed', 'signed', 'declined', 'expired'));

CREATE TABLE IF NOT EXISTS document_signatures (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signer_role TEXT,
  signature_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending_signature',
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE document_signatures
  DROP CONSTRAINT IF EXISTS document_signatures_status_check,
  ADD CONSTRAINT document_signatures_status_check
    CHECK (status IN ('pending_signature', 'signed', 'declined', 'expired'));

CREATE INDEX IF NOT EXISTS document_signatures_document_idx
  ON document_signatures (document_id, signature_order);

CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT,
  changes_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS document_versions_unique_version
  ON document_versions (document_id, version_number);

CREATE TABLE IF NOT EXISTS document_audit_logs (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_audit_logs_document_idx
  ON document_audit_logs (document_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION set_documents_updated_at();

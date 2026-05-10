-- Migration: requests and file_records tables
-- Run only if tables are missing; seed only if 0 rows

-- ─── requests ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS requests (
  id               SERIAL PRIMARY KEY,
  request_id       TEXT UNIQUE,
  title            TEXT NOT NULL,
  requester        TEXT NOT NULL,
  category         TEXT NOT NULL,
  priority         TEXT NOT NULL DEFAULT 'normal'
                     CHECK (priority IN ('low','normal','high','urgent')),
  status           TEXT NOT NULL DEFAULT 'submitted'
                     CHECK (status IN ('submitted','under_review','approved','denied','completed')),
  description      TEXT,
  assigned_reviewer TEXT,
  submitted_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_form_id   TEXT,
  linked_task_id   INTEGER
);

-- Trigger to auto-populate request_id from serial id
CREATE OR REPLACE FUNCTION fn_generate_request_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_id IS NULL THEN
    NEW.request_id := 'REQ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_request_id ON requests;
CREATE TRIGGER trg_generate_request_id
  BEFORE INSERT ON requests
  FOR EACH ROW EXECUTE FUNCTION fn_generate_request_id();

-- ─── file_records ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS file_records (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT NOT NULL,
  category             TEXT NOT NULL,
  uploaded_by          TEXT NOT NULL,
  uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes           BIGINT DEFAULT 0,
  url                  TEXT NOT NULL DEFAULT '',
  linked_task_id       INTEGER,
  linked_request_id    INTEGER,
  linked_work_order_id INTEGER,
  linked_sop_id        INTEGER
);

-- Base tables that the incremental scripts/migrate-*.sql files assume already exist.
-- Reconstructed from application queries for fresh (staging) databases. Idempotent.
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  status TEXT DEFAULT 'active',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  auth_provider TEXT,
  auth_subject TEXT,
  auth_last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  division TEXT DEFAULT 'Diversified',
  topic TEXT,
  due_date DATE,
  start_date DATE,
  start_time TEXT,
  end_time TEXT,
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  estimated_hours INTEGER DEFAULT 0,
  estimated_minutes INTEGER DEFAULT 0,
  notes TEXT,
  all_day BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  repeat_schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sops (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  department TEXT,
  owner TEXT,
  status TEXT DEFAULT 'draft',
  version TEXT DEFAULT '1.0',
  content TEXT,
  review_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  location TEXT,
  reorder_threshold NUMERIC DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forms (
  id SERIAL PRIMARY KEY,
  title TEXT,
  type TEXT,
  submitted_by INTEGER,
  status TEXT DEFAULT 'submitted',
  form_data JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

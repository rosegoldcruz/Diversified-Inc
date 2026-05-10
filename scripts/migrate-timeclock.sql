CREATE TABLE IF NOT EXISTS timeclock_entries (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  total_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN clock_out IS NOT NULL
    THEN EXTRACT(EPOCH FROM (clock_out - clock_in))::INTEGER / 60
    ELSE NULL END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timesheets (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  monday_hours NUMERIC(4,2) DEFAULT 0,
  tuesday_hours NUMERIC(4,2) DEFAULT 0,
  wednesday_hours NUMERIC(4,2) DEFAULT 0,
  thursday_hours NUMERIC(4,2) DEFAULT 0,
  friday_hours NUMERIC(4,2) DEFAULT 0,
  saturday_hours NUMERIC(4,2) DEFAULT 0,
  sunday_hours NUMERIC(4,2) DEFAULT 0,
  total_hours NUMERIC(6,2) GENERATED ALWAYS AS (
    monday_hours + tuesday_hours + wednesday_hours + thursday_hours +
    friday_hours + saturday_hours + sunday_hours
  ) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
  submitted_at TIMESTAMPTZ,
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO timeclock_entries (employee_id, employee_name, clock_in, clock_out, notes) VALUES
(1, 'Terry Strasser', '2026-05-08 08:00:00+00:00'::TIMESTAMPTZ, '2026-05-08 17:00:00+00:00'::TIMESTAMPTZ, 'Friday regular shift'),
(2, 'Jordan Strasser', '2026-05-08 08:30:00+00:00'::TIMESTAMPTZ, '2026-05-08 17:15:00+00:00'::TIMESTAMPTZ, 'Friday with lunch break'),
(3, 'Cathy Kraft', '2026-05-07 09:00:00+00:00'::TIMESTAMPTZ, '2026-05-07 17:30:00+00:00'::TIMESTAMPTZ, 'Thursday regular shift'),
(4, 'Jill Strasser', '2026-05-07 08:00:00+00:00'::TIMESTAMPTZ, '2026-05-07 16:45:00+00:00'::TIMESTAMPTZ, 'Thursday early departure'),
(1, 'Terry Strasser', '2026-05-09 07:30:00+00:00'::TIMESTAMPTZ, NULL, 'Currently clocked in'),
(2, 'Jordan Strasser', '2026-05-09 08:00:00+00:00'::TIMESTAMPTZ, NULL, 'Currently clocked in'),
(3, 'Cathy Kraft', '2026-05-09 08:15:00+00:00'::TIMESTAMPTZ, '2026-05-09 12:30:00+00:00'::TIMESTAMPTZ, 'Half day'),
(4, 'Jill Strasser', '2026-05-06 08:00:00+00:00'::TIMESTAMPTZ, '2026-05-06 17:00:00+00:00'::TIMESTAMPTZ, 'Monday regular shift');

INSERT INTO timesheets (employee_id, employee_name, week_start, week_end, monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours, sunday_hours, status, approved_by, submitted_at, notes) VALUES
(1, 'Terry Strasser', '2026-05-04'::DATE, '2026-05-10'::DATE, 8.0, 8.0, 8.0, 8.0, 8.0, 0, 0, 'approved', 'Admin', NULL, 'Regular work week'),
(2, 'Jordan Strasser', '2026-05-04'::DATE, '2026-05-10'::DATE, 8.5, 8.25, 8.0, 8.0, 8.25, 0, 0, 'approved', 'Admin', NULL, 'Regular work week'),
(3, 'Cathy Kraft', '2026-05-04'::DATE, '2026-05-10'::DATE, 8.0, 8.0, 8.0, 8.5, 4.0, 0, 0, 'submitted', NULL, '2026-05-09 17:30:00+00:00'::TIMESTAMPTZ, 'Friday half day - conference call'),
(4, 'Jill Strasser', '2026-05-04'::DATE, '2026-05-10'::DATE, 8.0, 7.75, 8.0, 8.0, 8.0, 0, 0, 'submitted', NULL, '2026-05-09 16:00:00+00:00'::TIMESTAMPTZ, 'Regular work week'),
(1, 'Terry Strasser', '2026-04-27'::DATE, '2026-05-03'::DATE, 8.0, 8.0, 8.0, 8.0, 8.0, 0, 0, 'draft', NULL, NULL, 'Previous week - draft');

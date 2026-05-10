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

WITH required_names AS (
  SELECT *
  FROM (VALUES
    (1, 'Terry Strasser'),
    (2, 'Jordan Strasser'),
    (3, 'Cathy Kraft'),
    (4, 'Jill Strasser')
  ) AS r(ord, employee_name)
),
required_employees AS (
  SELECT
    r.ord,
    e.id AS employee_id,
    COALESCE(e.name, r.employee_name) AS employee_name
  FROM required_names r
  LEFT JOIN employees e ON e.name = r.employee_name
),
extra_employees AS (
  SELECT
    4 + ROW_NUMBER() OVER (ORDER BY e.id) AS ord,
    e.id AS employee_id,
    e.name AS employee_name
  FROM employees e
  WHERE e.name NOT IN (
    'Terry Strasser',
    'Jordan Strasser',
    'Cathy Kraft',
    'Jill Strasser'
  )
  ORDER BY e.id
  LIMIT 4
),
seed_roster AS (
  SELECT ord, employee_id, employee_name
  FROM required_employees
  UNION ALL
  SELECT ord, employee_id, employee_name
  FROM extra_employees
),
ranked_roster AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY ord) AS rn,
    employee_id,
    employee_name
  FROM seed_roster
),
week_ref AS (
  SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE AS week_start
)
INSERT INTO timeclock_entries (
  employee_id,
  employee_name,
  clock_in,
  clock_out,
  notes
)
SELECT
  r.employee_id,
  r.employee_name,
  CASE r.rn
    WHEN 1 THEN (w.week_start - INTERVAL '2 day') + TIME '07:55'
    WHEN 2 THEN w.week_start + TIME '08:20'
    WHEN 3 THEN (w.week_start + INTERVAL '1 day') + TIME '07:45'
    WHEN 4 THEN (w.week_start + INTERVAL '1 day') + TIME '08:10'
    WHEN 5 THEN (w.week_start + INTERVAL '2 day') + TIME '08:00'
    WHEN 6 THEN (w.week_start + INTERVAL '3 day') + TIME '08:05'
    WHEN 7 THEN (w.week_start + INTERVAL '3 day') + TIME '07:50'
    ELSE (w.week_start + INTERVAL '4 day') + TIME '08:15'
  END AS clock_in,
  CASE r.rn
    WHEN 3 THEN NULL
    WHEN 6 THEN NULL
    WHEN 8 THEN NULL
    WHEN 1 THEN (w.week_start - INTERVAL '2 day') + TIME '16:50'
    WHEN 2 THEN w.week_start + TIME '17:10'
    WHEN 4 THEN (w.week_start + INTERVAL '1 day') + TIME '16:40'
    WHEN 5 THEN (w.week_start + INTERVAL '2 day') + TIME '17:05'
    ELSE (w.week_start + INTERVAL '3 day') + TIME '16:35'
  END AS clock_out,
  CASE r.rn
    WHEN 1 THEN 'Seed Timeclock: Crew staging and morning dispatch'
    WHEN 2 THEN 'Seed Timeclock: Jobsite coordination and vendor calls'
    WHEN 3 THEN 'Seed Timeclock: Active shift in progress'
    WHEN 4 THEN 'Seed Timeclock: Front office support and payroll prep'
    WHEN 5 THEN 'Seed Timeclock: Inventory reconciliation and deliveries'
    WHEN 6 THEN 'Seed Timeclock: Active shift in progress'
    WHEN 7 THEN 'Seed Timeclock: Work order closeout documentation'
    ELSE 'Seed Timeclock: Active shift in progress'
  END AS notes
FROM ranked_roster r
CROSS JOIN week_ref w
WHERE r.rn <= 8
  AND NOT EXISTS (
    SELECT 1
    FROM timeclock_entries t
    WHERE t.notes LIKE 'Seed Timeclock:%'
  );

WITH required_names AS (
  SELECT *
  FROM (VALUES
    (1, 'Terry Strasser'),
    (2, 'Jordan Strasser'),
    (3, 'Cathy Kraft'),
    (4, 'Jill Strasser')
  ) AS r(ord, employee_name)
),
required_employees AS (
  SELECT
    r.ord,
    e.id AS employee_id,
    COALESCE(e.name, r.employee_name) AS employee_name
  FROM required_names r
  LEFT JOIN employees e ON e.name = r.employee_name
),
extra_employees AS (
  SELECT
    4 + ROW_NUMBER() OVER (ORDER BY e.id) AS ord,
    e.id AS employee_id,
    e.name AS employee_name
  FROM employees e
  WHERE e.name NOT IN (
    'Terry Strasser',
    'Jordan Strasser',
    'Cathy Kraft',
    'Jill Strasser'
  )
  ORDER BY e.id
  LIMIT 1
),
timesheet_roster AS (
  SELECT ord, employee_id, employee_name
  FROM required_employees
  UNION ALL
  SELECT ord, employee_id, employee_name
  FROM extra_employees
),
ranked_timesheets AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY ord) AS rn,
    employee_id,
    employee_name
  FROM timesheet_roster
),
week_ref AS (
  SELECT DATE_TRUNC('week', CURRENT_DATE)::DATE AS week_start
)
INSERT INTO timesheets (
  employee_id,
  employee_name,
  week_start,
  week_end,
  monday_hours,
  tuesday_hours,
  wednesday_hours,
  thursday_hours,
  friday_hours,
  saturday_hours,
  sunday_hours,
  status,
  submitted_at,
  approved_by,
  notes
)
SELECT
  r.employee_id,
  r.employee_name,
  w.week_start,
  w.week_start + INTERVAL '6 day',
  CASE r.rn WHEN 1 THEN 8.00 WHEN 2 THEN 8.50 WHEN 3 THEN 8.00 WHEN 4 THEN 7.75 ELSE 8.00 END,
  CASE r.rn WHEN 1 THEN 8.00 WHEN 2 THEN 8.25 WHEN 3 THEN 8.00 WHEN 4 THEN 8.00 ELSE 8.00 END,
  CASE r.rn WHEN 1 THEN 8.00 WHEN 2 THEN 8.00 WHEN 3 THEN 8.00 WHEN 4 THEN 8.00 ELSE 8.00 END,
  CASE r.rn WHEN 1 THEN 8.00 WHEN 2 THEN 8.00 WHEN 3 THEN 8.50 WHEN 4 THEN 8.00 ELSE 8.00 END,
  CASE r.rn WHEN 1 THEN 8.00 WHEN 2 THEN 8.25 WHEN 3 THEN 4.00 WHEN 4 THEN 8.00 ELSE 0.00 END,
  0.00,
  0.00,
  CASE r.rn
    WHEN 1 THEN 'approved'
    WHEN 2 THEN 'approved'
    WHEN 3 THEN 'submitted'
    WHEN 4 THEN 'submitted'
    ELSE 'draft'
  END,
  CASE WHEN r.rn IN (3, 4) THEN NOW() ELSE NULL END,
  CASE WHEN r.rn IN (1, 2) THEN 'Payroll Admin' ELSE NULL END,
  CASE r.rn
    WHEN 1 THEN 'Seed Timesheet: Leadership operations week'
    WHEN 2 THEN 'Seed Timesheet: Field operations and dispatch support'
    WHEN 3 THEN 'Seed Timesheet: Submitted pending payroll review'
    WHEN 4 THEN 'Seed Timesheet: Submitted pending manager approval'
    ELSE 'Seed Timesheet: Draft awaiting final hours'
  END
FROM ranked_timesheets r
CROSS JOIN week_ref w
WHERE r.rn <= 5
  AND NOT EXISTS (
    SELECT 1
    FROM timesheets t
    WHERE t.week_start = w.week_start
      AND t.notes LIKE 'Seed Timesheet:%'
  );

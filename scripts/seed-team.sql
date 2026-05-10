-- Seed real Diversified team members
-- Execute against diversified_os database

INSERT INTO employees (name, role, department, status, email, phone, hire_date) VALUES
('Terry Strasser', 'CEO', 'Executive', 'active', 'tstrasser@divco.net', '608-555-0201', '2005-01-01'),
('Jordan Strasser', 'Operations Director', 'Operations', 'active', 'jordan@divco.net', '608-555-0202', '2010-03-15'),
('Cathy Kraft', 'Office Manager', 'Administration', 'active', 'ckraft@divco.net', '608-555-0203', '2012-06-01'),
('Jill Strasser', 'HR Manager', 'Human Resources', 'active', 'jstrasser@divco.net', '608-555-0204', '2008-09-10');

-- 6 new tasks assigned to the new team members (IDs 7, 8, 9, 10)
INSERT INTO tasks (title, description, status, priority, assigned_to, due_date) VALUES
('Q2 Financial Review Preparation', 'Compile and review Q2 financial statements for leadership meeting', 'in_progress', 'high', 7, '2026-05-20'),
('Vendor Contract Renewals', 'Review and renew expiring vendor contracts for Q3', 'todo', 'medium', 8, '2026-06-01'),
('Office Supply Inventory Audit', 'Conduct full audit of office supplies and restock essentials', 'in_progress', 'medium', 9, '2026-05-15'),
('Employee Handbook Update', 'Update employee handbook with new remote work policies', 'todo', 'high', 10, '2026-05-25'),
('Fleet Maintenance Schedule', 'Create preventive maintenance schedule for all company vehicles', 'todo', 'medium', 8, '2026-05-18'),
('New Hire Onboarding Plan', 'Design updated onboarding program for summer hires', 'in_progress', 'medium', 10, '2026-05-22');

-- 4 new work orders assigned to the new team members
INSERT INTO work_orders (title, description, type, status, priority, owner, due_date) VALUES
('Executive Office Renovation', 'Coordinate renovation of executive office suite including flooring and paint', 'Facility', 'in_progress', 'high', 7, '2026-06-10'),
('Warehouse Safety Inspection', 'Complete OSHA-compliant safety inspection of main warehouse', 'Safety', 'open', 'high', 8, '2026-05-28'),
('Admin Wing HVAC Repair', 'Repair HVAC system in administrative wing - temperature fluctuations reported', 'Maintenance', 'open', 'medium', 9, '2026-05-20'),
('HR Document Digitization', 'Scan and digitize all historical HR records into document management system', 'Administrative', 'open', 'medium', 10, '2026-06-15');

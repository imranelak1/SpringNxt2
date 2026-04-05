-- SpringNxt demo seed data
-- Safe to run multiple times for the same demo emails/project names.

-- Demo users
INSERT INTO users (email, first_name, last_name, password, provider, role, enabled, created_at)
SELECT 'admin@springnxt.local', 'Admin', 'Lead',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'LOCAL', 'ADMIN', true, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@springnxt.local'
);

INSERT INTO users (email, first_name, last_name, password, provider, role, enabled, created_at)
SELECT 'manager@springnxt.local', 'Maya', 'Manager',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'LOCAL', 'MANAGER', true, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'manager@springnxt.local'
);

INSERT INTO users (email, first_name, last_name, password, provider, role, enabled, created_at)
SELECT 'employee1@springnxt.local', 'Ethan', 'Builder',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'LOCAL', 'EMPLOYEE', true, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'employee1@springnxt.local'
);

INSERT INTO users (email, first_name, last_name, password, provider, role, enabled, created_at)
SELECT 'employee2@springnxt.local', 'Rania', 'Analyst',
       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       'LOCAL', 'EMPLOYEE', true, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'employee2@springnxt.local'
);

-- Demo projects
INSERT INTO projects (name, description, status, start_date, end_date, budget, progress_percentage, created_at)
SELECT 'SpringNxt Platform',
       'Intelligent project management platform with analytics dashboard and team allocation.',
       'ACTIVE',
       '2026-04-01',
       '2026-07-31',
       25000.00,
       45,
       NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE name = 'SpringNxt Platform'
);

INSERT INTO projects (name, description, status, start_date, end_date, budget, progress_percentage, created_at)
SELECT 'AI PDF Import Engine',
       'OCR and extraction workflow for importing project data from PDF reports.',
       'PLANNING',
       '2026-04-10',
       '2026-06-15',
       12000.00,
       15,
       NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE name = 'AI PDF Import Engine'
);

-- Demo project members
INSERT INTO project_members (project_id, user_id, role, allocation_percentage, created_at)
SELECT p.id, u.id, 'OWNER', 100, NOW()
FROM projects p
JOIN users u ON u.email = 'admin@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = u.id
  );

INSERT INTO project_members (project_id, user_id, role, allocation_percentage, created_at)
SELECT p.id, u.id, 'MANAGER', 80, NOW()
FROM projects p
JOIN users u ON u.email = 'manager@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = u.id
  );

INSERT INTO project_members (project_id, user_id, role, allocation_percentage, created_at)
SELECT p.id, u.id, 'CONTRIBUTOR', 60, NOW()
FROM projects p
JOIN users u ON u.email = 'employee1@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = u.id
  );

INSERT INTO project_members (project_id, user_id, role, allocation_percentage, created_at)
SELECT p.id, u.id, 'CONTRIBUTOR', 50, NOW()
FROM projects p
JOIN users u ON u.email = 'employee2@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = u.id
  );

INSERT INTO project_members (project_id, user_id, role, allocation_percentage, created_at)
SELECT p.id, u.id, 'OWNER', 100, NOW()
FROM projects p
JOIN users u ON u.email = 'manager@springnxt.local'
WHERE p.name = 'AI PDF Import Engine'
  AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.user_id = u.id
  );

-- Demo tasks
INSERT INTO tasks (title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, project_id, assignee_id, created_at)
SELECT 'Build authentication backend',
       'Finalize JWT authentication and user verification flow.',
       'DONE',
       'HIGH',
       '2026-04-01',
       '2026-04-08',
       14,
       12,
       p.id,
       u.id,
       NOW()
FROM projects p
JOIN users u ON u.email = 'employee1@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.title = 'Build authentication backend'
  );

INSERT INTO tasks (title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, project_id, assignee_id, created_at)
SELECT 'Create project CRUD API',
       'Implement project endpoints, service layer, and validation.',
       'DONE',
       'HIGH',
       '2026-04-04',
       '2026-04-10',
       10,
       9,
       p.id,
       u.id,
       NOW()
FROM projects p
JOIN users u ON u.email = 'manager@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.title = 'Create project CRUD API'
  );

INSERT INTO tasks (title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, project_id, assignee_id, created_at)
SELECT 'Create task and assignment API',
       'Add tasks, project members, and resource allocation endpoints.',
       'IN_PROGRESS',
       'HIGH',
       '2026-04-06',
       '2026-04-14',
       16,
       7,
       p.id,
       u.id,
       NOW()
FROM projects p
JOIN users u ON u.email = 'employee2@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.title = 'Create task and assignment API'
  );

INSERT INTO tasks (title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, project_id, assignee_id, created_at)
SELECT 'Design dashboard analytics',
       'Compute health score metrics and dashboard summaries.',
       'TODO',
       'MEDIUM',
       '2026-04-12',
       '2026-04-20',
       12,
       0,
       p.id,
       u.id,
       NOW()
FROM projects p
JOIN users u ON u.email = 'manager@springnxt.local'
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.title = 'Design dashboard analytics'
  );

INSERT INTO tasks (title, description, status, priority, start_date, due_date, estimated_hours, actual_hours, project_id, assignee_id, created_at)
SELECT 'Prototype PDF extraction flow',
       'Define ingestion flow and mapping for imported PDF content.',
       'IN_PROGRESS',
       'MEDIUM',
       '2026-04-10',
       '2026-04-25',
       20,
       6,
       p.id,
       u.id,
       NOW()
FROM projects p
JOIN users u ON u.email = 'manager@springnxt.local'
WHERE p.name = 'AI PDF Import Engine'
  AND NOT EXISTS (
      SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.title = 'Prototype PDF extraction flow'
  );

-- Demo health scores
INSERT INTO health_scores (project_id, overall_score, delay_score, progress_score, workload_score, budget_score, calculated_at)
SELECT p.id, 72, 85, 45, 50, 80, NOW()
FROM projects p
WHERE p.name = 'SpringNxt Platform'
  AND NOT EXISTS (
      SELECT 1 FROM health_scores hs WHERE hs.project_id = p.id
  );

INSERT INTO health_scores (project_id, overall_score, delay_score, progress_score, workload_score, budget_score, calculated_at)
SELECT p.id, 54, 90, 15, 40, 80, NOW()
FROM projects p
WHERE p.name = 'AI PDF Import Engine'
  AND NOT EXISTS (
      SELECT 1 FROM health_scores hs WHERE hs.project_id = p.id
  );

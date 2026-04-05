INSERT INTO users (email, first_name, last_name, password, provider, role, enabled, created_at)
VALUES
('admin@springnxt.local', 'Admin', 'Nexus', 'password', 'LOCAL', 'ADMIN', TRUE, NOW()),
('manager@springnxt.local', 'Project', 'Manager', 'password', 'LOCAL', 'MANAGER', TRUE, NOW()),
('employee1@springnxt.local', 'Team', 'Member', 'password', 'LOCAL', 'EMPLOYEE', TRUE, NOW())
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  password = VALUES(password),
  provider = VALUES(provider),
  role = VALUES(role),
  enabled = VALUES(enabled);

INSERT INTO calendar_events (title, description, event_date, type, created_by_user_id, created_at)
SELECT
  'Kickoff produit',
  'Alignement scope et planning de sprint.',
  '2026-04-08',
  'MEETING',
  u.id,
  NOW()
FROM users u
WHERE u.email = 'manager@springnxt.local'
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.title = 'Kickoff produit' AND ce.event_date = '2026-04-08'
  );

INSERT INTO calendar_events (title, description, event_date, type, created_by_user_id, created_at)
SELECT
  'Deadline API paiements',
  'Livraison endpoint v1 plus tests integration.',
  '2026-04-12',
  'DEADLINE',
  u.id,
  NOW()
FROM users u
WHERE u.email = 'manager@springnxt.local'
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.title = 'Deadline API paiements' AND ce.event_date = '2026-04-12'
  );

INSERT INTO calendar_events (title, description, event_date, type, created_by_user_id, created_at)
SELECT
  'Milestone UI dashboard',
  'Version UI validee pour la revue interne.',
  '2026-04-16',
  'MILESTONE',
  u.id,
  NOW()
FROM users u
WHERE u.email = 'admin@springnxt.local'
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.title = 'Milestone UI dashboard' AND ce.event_date = '2026-04-16'
  );

INSERT INTO calendar_events (title, description, event_date, type, created_by_user_id, created_at)
SELECT
  'Retro sprint',
  'Retro equipe: points forts, points amelioration.',
  '2026-04-18',
  'MEETING',
  u.id,
  NOW()
FROM users u
WHERE u.email = 'manager@springnxt.local'
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.title = 'Retro sprint' AND ce.event_date = '2026-04-18'
  );

INSERT INTO calendar_events (title, description, event_date, type, created_by_user_id, created_at)
SELECT
  'Release candidat',
  'Gel des features et preparation UAT.',
  '2026-04-22',
  'CUSTOM',
  u.id,
  NOW()
FROM users u
WHERE u.email = 'admin@springnxt.local'
  AND NOT EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.title = 'Release candidat' AND ce.event_date = '2026-04-22'
  );
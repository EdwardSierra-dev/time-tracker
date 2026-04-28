-- ============================================================
-- TimeTracker — Seed Data
-- ============================================================
-- NOTE: Run this AFTER creating users via Supabase Auth dashboard
-- or via the auth.users insert below (only works in local dev).
-- In production, create users via Supabase Auth UI and then
-- update their profiles manually.

-- Projects
INSERT INTO projects (id, name) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Portal Web'),
  ('11111111-0000-0000-0000-000000000002', 'App Móvil'),
  ('11111111-0000-0000-0000-000000000003', 'API Backend'),
  ('11111111-0000-0000-0000-000000000004', 'Infraestructura'),
  ('11111111-0000-0000-0000-000000000005', 'Soporte');

-- Hour limits per country
INSERT INTO hour_limits (country, daily_limit, weekly_limit, monthly_limit) VALUES
  ('Argentina', 8, 40, 160),
  ('Colombia',  8, 40, 160),
  ('México',    8, 40, 176),
  ('España',    8, 40, 168),
  ('Chile',     8, 45, 180);

-- ============================================================
-- Example: create test users (local dev only via SQL)
-- In production use Supabase Auth dashboard instead
-- ============================================================
/*
-- Lead user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'lead@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Laura Gómez", "role": "LEAD", "country": "Argentina"}'
);

-- Analyst users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'ana@example.com',    crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Ana Martínez", "role": "ANALYST", "country": "Argentina"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'carlos@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Carlos Ruiz",   "role": "ANALYST", "country": "Colombia"}'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'sofia@example.com',  crypt('password123', gen_salt('bf')), NOW(), '{"full_name": "Sofía López",   "role": "ANALYST", "country": "México"}');

-- Sample time entries (adjust user_ids to match above)
INSERT INTO time_entries (user_id, project_id, date, hours, client, environment, task, description)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', CURRENT_DATE,     6.5, 'Acme Corp',  'Producción', 'Desarrollo UI',    'Implementación de componentes React'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', CURRENT_DATE - 1, 4.0, 'Acme Corp',  'QA',         'Testing API',      'Pruebas de integración'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', CURRENT_DATE,     8.0, 'Beta SA',    'Producción', 'Feature móvil',    'Pantalla de login'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004', CURRENT_DATE - 2, 3.5, 'Gamma Inc',  'Dev',        'Infra setup',      'Configuración de CI/CD');
*/

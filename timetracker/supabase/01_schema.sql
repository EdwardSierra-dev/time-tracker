-- ============================================================
-- TimeTracker — Schema
-- ============================================================

-- Enum for roles
CREATE TYPE user_role AS ENUM ('LEAD', 'ANALYST');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'ANALYST',
  country     TEXT NOT NULL DEFAULT ''
);

-- Projects
CREATE TABLE projects (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

-- Time entries
CREATE TABLE time_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  hours       NUMERIC(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  client      TEXT NOT NULL DEFAULT '',
  environment TEXT NOT NULL DEFAULT '',
  task        TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_date    ON time_entries(date);

-- Hour limits per country
CREATE TABLE hour_limits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country        TEXT NOT NULL UNIQUE,
  daily_limit    NUMERIC(5, 2) NOT NULL DEFAULT 8,
  weekly_limit   NUMERIC(5, 2) NOT NULL DEFAULT 40,
  monthly_limit  NUMERIC(5, 2) NOT NULL DEFAULT 160
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, country)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ANALYST'),
    COALESCE(NEW.raw_user_meta_data->>'country', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

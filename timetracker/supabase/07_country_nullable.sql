-- ============================================================
-- TimeTracker — Make profiles.country nullable
-- Users who register without a country must complete it on
-- first login via the /complete-profile page (requirements_2_2).
-- ============================================================

-- Drop NOT NULL constraint and remove the default so new rows
-- without a country land as NULL (not empty string).
ALTER TABLE profiles
  ALTER COLUMN country DROP NOT NULL,
  ALTER COLUMN country DROP DEFAULT;

-- Normalize empty strings from existing rows to NULL so the
-- "country is null" check works consistently.
UPDATE profiles SET country = NULL WHERE TRIM(country) = '';

-- Update the auto-create trigger: country defaults to NULL when
-- not provided in user metadata.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, country, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ANALYST'),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'country', '')), ''),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

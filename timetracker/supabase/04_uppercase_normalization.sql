-- ============================================================
-- TimeTracker — Uppercase normalization trigger
-- Ensures country, client, environment, task are always stored
-- in UPPERCASE regardless of what the client sends.
-- ============================================================

CREATE OR REPLACE FUNCTION normalize_text_fields()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.client      := UPPER(TRIM(NEW.client));
  NEW.environment := UPPER(TRIM(NEW.environment));
  NEW.task        := UPPER(TRIM(NEW.task));
  RETURN NEW;
END;
$$;

CREATE TRIGGER time_entries_normalize
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION normalize_text_fields();

-- Normalize profiles.country
CREATE OR REPLACE FUNCTION normalize_profile_fields()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.country := UPPER(TRIM(NEW.country));
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_normalize
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION normalize_profile_fields();

-- Normalize hour_limits.country
CREATE TRIGGER hour_limits_normalize
  BEFORE INSERT OR UPDATE ON hour_limits
  FOR EACH ROW EXECUTE FUNCTION normalize_profile_fields();

-- ============================================================
-- Backfill existing data
-- ============================================================
UPDATE time_entries SET
  client      = UPPER(TRIM(client)),
  environment = UPPER(TRIM(environment)),
  task        = UPPER(TRIM(task));

UPDATE profiles SET
  country = UPPER(TRIM(country));

UPDATE hour_limits SET
  country = UPPER(TRIM(country));

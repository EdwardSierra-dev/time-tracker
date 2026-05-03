-- ============================================================
-- TimeTracker — Add country to time_entries
-- Each entry now stores the country where the work was done,
-- independent of the analyst's profile country.
-- This allows a Mexican analyst to log work done in Chile
-- and have it appear correctly in the Lead's country filter.
-- ============================================================

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Backfill existing entries from the analyst's profile country
UPDATE time_entries te
SET country = p.country
FROM profiles p
WHERE te.user_id = p.id
  AND te.country IS NULL
  AND p.country IS NOT NULL;

-- Normalize existing values to uppercase (consistent with other text fields)
UPDATE time_entries SET country = UPPER(TRIM(country)) WHERE country IS NOT NULL;

-- Extend the normalize trigger to include country
CREATE OR REPLACE FUNCTION normalize_text_fields()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.client      := UPPER(TRIM(NEW.client));
  NEW.environment := UPPER(TRIM(NEW.environment));
  NEW.task        := UPPER(TRIM(NEW.task));
  IF NEW.country IS NOT NULL THEN
    NEW.country := UPPER(TRIM(NEW.country));
  END IF;
  RETURN NEW;
END;
$$;

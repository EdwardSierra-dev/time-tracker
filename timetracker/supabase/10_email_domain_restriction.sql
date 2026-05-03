-- ============================================================
-- TimeTracker — Email domain restriction (Rhiscom only)
-- ============================================================
-- Enforces that only corporate Rhiscom email addresses can be
-- stored in auth.users. This is the database-level safety net
-- that prevents bypassing frontend/API validation.
-- Allowed domains: rhiscom.cl, rhiscom.com
-- ============================================================

-- Helper function: extract domain from an email address
CREATE OR REPLACE FUNCTION get_email_domain(email TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(split_part(email, '@', 2));
$$;

-- Check constraint on auth.users via a trigger on profiles
-- (auth.users cannot be altered directly, so we enforce on the
-- profiles table which is created synchronously with every user)
CREATE OR REPLACE FUNCTION enforce_rhiscom_email_domain()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
  v_domain TEXT;
BEGIN
  -- Fetch the email from auth.users for the profile being inserted/updated
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

  v_domain := get_email_domain(v_email);

  IF v_domain NOT IN ('rhiscom.cl', 'rhiscom.com') THEN
    RAISE EXCEPTION
      'Solo se permiten correos corporativos de Rhiscom (rhiscom.cl o rhiscom.com). Dominio recibido: %',
      v_domain
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Fire on every INSERT into profiles (which happens right after
-- a new auth.users row is created via the handle_new_user trigger)
DROP TRIGGER IF EXISTS enforce_email_domain_on_profile ON profiles;
CREATE TRIGGER enforce_email_domain_on_profile
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_rhiscom_email_domain();

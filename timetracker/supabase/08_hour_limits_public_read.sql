-- ============================================================
-- TimeTracker — Allow public (unauthenticated) read on hour_limits
-- hour_limits contains only configuration data (countries and
-- their hour thresholds). There is no sensitive information,
-- so anonymous users can read it — needed for the registration
-- form country dropdown before the user has a session.
-- ============================================================

-- Drop the existing authenticated-only select policy
DROP POLICY IF EXISTS "hour_limits_select" ON hour_limits;

-- Allow anyone (authenticated or not) to read hour_limits
CREATE POLICY "hour_limits_select" ON hour_limits
  FOR SELECT USING (true);

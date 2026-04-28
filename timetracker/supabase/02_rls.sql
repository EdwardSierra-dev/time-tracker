-- ============================================================
-- TimeTracker — Row Level Security Policies
-- ============================================================

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; LEADs can read all
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR get_my_role() = 'LEAD'
  );

-- Users can update only their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- PROJECTS
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read projects
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only LEADs can manage projects
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (get_my_role() = 'LEAD');

CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (get_my_role() = 'LEAD');

CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (get_my_role() = 'LEAD');

-- ============================================================
-- TIME ENTRIES
-- ============================================================
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- ANALYSTs see only their own; LEADs see all
CREATE POLICY "time_entries_select" ON time_entries
  FOR SELECT USING (
    user_id = auth.uid() OR get_my_role() = 'LEAD'
  );

-- Anyone authenticated can insert their own entries
CREATE POLICY "time_entries_insert" ON time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own entries
CREATE POLICY "time_entries_update" ON time_entries
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own entries
CREATE POLICY "time_entries_delete" ON time_entries
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- HOUR LIMITS
-- ============================================================
ALTER TABLE hour_limits ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read limits
CREATE POLICY "hour_limits_select" ON hour_limits
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only LEADs can manage limits
CREATE POLICY "hour_limits_insert" ON hour_limits
  FOR INSERT WITH CHECK (get_my_role() = 'LEAD');

CREATE POLICY "hour_limits_update" ON hour_limits
  FOR UPDATE USING (get_my_role() = 'LEAD');

CREATE POLICY "hour_limits_delete" ON hour_limits
  FOR DELETE USING (get_my_role() = 'LEAD');

-- ============================================================
-- TimeTracker — Audit Logs table + username on profiles
-- ============================================================

-- Add username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type  TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  metadata     JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp   ON audit_logs(timestamp DESC);

-- ============================================================
-- RLS for audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only LEADs can read audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (get_my_role() = 'LEAD');

-- Inserts are done via service role only (no direct client insert)
-- No INSERT policy needed for anon/authenticated role

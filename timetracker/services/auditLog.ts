import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { AuditActionType } from "@/lib/types";

interface LogEntry {
  user_id: string;
  action_type: AuditActionType;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Write an audit log entry using the service-role client so it bypasses RLS.
 * Only call this from server-side API routes.
 */
export async function writeAuditLog(entry: LogEntry): Promise<void> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.from("audit_logs").insert({
    user_id: entry.user_id,
    action_type: entry.action_type,
    description: entry.description,
    metadata: entry.metadata,
  });

  if (error) {
    // Non-fatal: log to server console but don't break the main flow
    console.error("[AuditLog] Failed to write log:", error.message, entry);
  }
}

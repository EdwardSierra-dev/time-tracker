import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/services/auditLog";
import type { AuditActionType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "LEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action_type, description, metadata } = body as {
    action_type: AuditActionType;
    description: string;
    metadata: Record<string, unknown>;
  };

  await writeAuditLog({ user_id: user.id, action_type, description, metadata });

  return NextResponse.json({ success: true });
}

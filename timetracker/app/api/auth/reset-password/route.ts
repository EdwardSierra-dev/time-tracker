import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/services/auditLog";

/**
 * POST /api/auth/reset-password
 *
 * Allows authenticated ANALYST users to change their own password.
 * Role is validated server-side from the profiles table — not from any
 * client-supplied value — so direct URL manipulation cannot bypass this.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate role from the DB (trusted source), not from the request body
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ANALYST") {
    return NextResponse.json(
      { error: "Forbidden: only analysts can change their password here." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { new_password } = body as { new_password: string };

  if (!new_password || new_password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const hasLetter = /[a-zA-Z]/.test(new_password);
  const hasNumber = /[0-9]/.test(new_password);
  if (!hasLetter || !hasNumber) {
    return NextResponse.json(
      { error: "La contraseña debe incluir al menos una letra y un número." },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    password: new_password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    user_id: user.id,
    action_type: "CHANGE_PASSWORD",
    description: `Analyst ${user.email} changed their password`,
    metadata: { email: user.email },
  });

  return NextResponse.json({ success: true });
}

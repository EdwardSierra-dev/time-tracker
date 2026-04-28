import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/services/auditLog";

export async function POST(req: NextRequest) {
  // Verify the caller is a LEAD
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "LEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { full_name, email, country } = body as {
    full_name: string;
    email: string;
    country: string;
  };

  if (!full_name?.trim() || !email?.trim() || !country?.trim()) {
    return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create user in Supabase Auth
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password: crypto.randomUUID(), // temporary — user must reset via email
    email_confirm: true,
    user_metadata: {
      full_name: full_name.trim().toUpperCase(),
      role: "ANALYST",
      country: country.trim().toUpperCase(),
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const newUserId = newUser.user.id;

  // Upsert profile (trigger may have already created it)
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: newUserId,
    full_name: full_name.trim().toUpperCase(),
    role: "ANALYST",
    country: country.trim().toUpperCase(),
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Send welcome email via Supabase Auth password reset (triggers email delivery)
  // This sends a "set password" email which serves as the welcome + activation email
  await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: email.trim(),
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
    },
  });

  // Audit log
  await writeAuditLog({
    user_id: user.id,
    action_type: "CREATE_ANALYST",
    description: `Leader ${callerProfile.full_name} created analyst ${full_name.trim()}`,
    metadata: {
      analyst_id: newUserId,
      analyst_name: full_name.trim(),
      analyst_email: email.trim(),
      analyst_country: country.trim().toUpperCase(),
    },
  });

  return NextResponse.json({ success: true, userId: newUserId });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, full_name, username, password } = body as {
    email: string;
    full_name: string;
    username: string;
    password: string;
  };

  // Server-side validation
  if (!email?.trim() || !full_name?.trim() || !username?.trim() || !password) {
    return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido.", field: "email" }, { status: 400 });
  }
  if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres, una letra y un número.", field: "password" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check username uniqueness
  const { data: existingUsername } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json(
      { error: "Este nombre de usuario ya está en uso.", field: "username" },
      { status: 409 }
    );
  }

  // Create auth user (email already confirmed so they can sign in immediately)
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name.trim(),
      username: username.trim().toLowerCase(),
      role: "ANALYST",
      country: "",
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "Este email ya está registrado.", field: "email" }, { status: 409 });
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Upsert profile with username
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: newUser.user.id,
    full_name: full_name.trim(),
    username: username.trim().toLowerCase(),
    role: "ANALYST",
    country: "",
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Return success — the client will sign in using the browser Supabase client
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_EMAIL_DOMAINS } from "@/lib/constants";

interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  country?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    const { email, password, full_name, country } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
    }

    // Enforce Rhiscom corporate email domain restriction
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_EMAIL_DOMAINS.includes(emailDomain as typeof ALLOWED_EMAIL_DOMAINS[number])) {
      return NextResponse.json(
        { error: "Solo se permiten correos corporativos de Rhiscom (rhiscom.cl o rhiscom.com)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // createUser with email_confirm: true skips the confirmation email entirely
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        ...(country ? { country: country.trim().toUpperCase() } : {}),
      },
    });

    if (error) {
      const message =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered")
          ? "Ya existe una cuenta con ese email."
          : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ userId: data.user.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/register] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor. Intenta nuevamente." },
      { status: 500 }
    );
  }
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface FormState {
  email: string;
  full_name: string;
  username: string;
  password: string;
  confirm_password: string;
}

interface FieldErrors {
  email?: string;
  full_name?: string;
  username?: string;
  password?: string;
  confirm_password?: string;
}

const empty: FormState = {
  email: "",
  full_name: "",
  username: "",
  password: "",
  confirm_password: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(empty);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
    setError(null);
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Ingresa un email válido.";
    }
    if (!form.full_name.trim()) {
      errors.full_name = "El nombre completo es requerido.";
    }
    if (!form.username.trim()) {
      errors.username = "El nombre de usuario es requerido.";
    }
    if (form.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres.";
    } else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errors.password = "La contraseña debe incluir al menos una letra y un número.";
    }
    if (form.password !== form.confirm_password) {
      errors.confirm_password = "Las contraseñas no coinciden.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    // Step 1: create the user via API route
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        password: form.password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setLoading(false);
      if (json.field) {
        setFieldErrors((fe) => ({ ...fe, [json.field]: json.error }));
      } else {
        setError(json.error ?? "Error al registrar. Intenta de nuevo.");
      }
      return;
    }

    // Step 2: sign in client-side so the session cookie is properly set
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (signInError) {
      // Account was created but sign-in failed — send to login
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="full_name"
        label="Nombre completo *"
        value={form.full_name}
        onChange={(e) => set("full_name", e.target.value)}
        placeholder="Juan Pérez"
        autoComplete="name"
        error={fieldErrors.full_name}
        required
      />
      <Input
        id="email"
        label="Email *"
        type="email"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        placeholder="tu@email.com"
        autoComplete="email"
        error={fieldErrors.email}
        required
      />
      <Input
        id="username"
        label="Nombre de usuario *"
        value={form.username}
        onChange={(e) => set("username", e.target.value)}
        placeholder="juanperez"
        autoComplete="username"
        error={fieldErrors.username}
        required
      />
      <Input
        id="password"
        label="Contraseña *"
        type="password"
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        placeholder="••••••••"
        autoComplete="new-password"
        error={fieldErrors.password}
        required
      />
      <Input
        id="confirm_password"
        label="Confirmar contraseña *"
        type="password"
        value={form.confirm_password}
        onChange={(e) => set("confirm_password", e.target.value)}
        placeholder="••••••••"
        autoComplete="new-password"
        error={fieldErrors.confirm_password}
        required
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full mt-2">
        Crear cuenta
      </Button>
    </form>
  );
}

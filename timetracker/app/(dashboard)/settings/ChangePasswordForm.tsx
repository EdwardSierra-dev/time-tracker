"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ChangePasswordForm() {
  const [form, setForm] = useState({ new_password: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState<{ new_password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
    setError(null);
    setSuccess(false);
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (form.new_password.length < 6) {
      errors.new_password = "Mínimo 6 caracteres.";
    } else if (!/[a-zA-Z]/.test(form.new_password) || !/[0-9]/.test(form.new_password)) {
      errors.new_password = "Debe incluir al menos una letra y un número.";
    }
    if (form.new_password !== form.confirm) {
      errors.confirm = "Las contraseñas no coinciden.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: form.new_password }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Error al cambiar la contraseña.");
      return;
    }

    setSuccess(true);
    setForm({ new_password: "", confirm: "" });
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <Input
          id="new_password"
          label="Nueva contraseña *"
          type="password"
          value={form.new_password}
          onChange={(e) => set("new_password", e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          error={fieldErrors.new_password}
          required
        />
        <Input
          id="confirm"
          label="Confirmar contraseña *"
          type="password"
          value={form.confirm}
          onChange={(e) => set("confirm", e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          error={fieldErrors.confirm}
          required
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Contraseña actualizada correctamente.
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Actualizar contraseña
          </Button>
        </div>
      </form>
    </Card>
  );
}

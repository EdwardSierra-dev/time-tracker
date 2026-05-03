"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <Input
          id="new-password"
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          required
        />
        <Input
          id="confirm-password"
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
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

        <Button type="submit" loading={loading} className="self-start">
          Actualizar contraseña
        </Button>
      </form>
    </Card>
  );
}

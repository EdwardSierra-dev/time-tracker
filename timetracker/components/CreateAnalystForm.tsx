"use client";

import { useState } from "react";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

interface CreatedAnalyst {
  full_name: string;
  email: string;
  country: string;
}

interface Props {
  onCreated?: (analyst: CreatedAnalyst) => void;
}

const emptyForm = { full_name: "", email: "", country: "" };

export function CreateAnalystForm({ onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.full_name.trim() || !form.email.trim() || !form.country.trim()) {
      setError("Todos los campos son requeridos.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/create-analyst", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Error al crear el analista.");
      return;
    }

    setSuccess(`Analista "${form.full_name}" creado correctamente. Se le enviará un email para establecer su contraseña.`);
    onCreated?.(form);
    setForm(emptyForm);
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Crear analista</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            id="full_name"
            label="Nombre completo *"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Juan Pérez"
            required
          />
          <Input
            id="email"
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="juan@empresa.com"
            required
          />
          <Input
            id="country"
            label="País *"
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="Argentina"
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Crear analista
          </Button>
        </div>
      </form>
    </Card>
  );
}

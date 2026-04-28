"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLIENTS, TASKS, ENVIRONMENTS } from "@/lib/constants";
import type { TimeEntry } from "@/lib/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";

interface TimeEntryFormProps {
  userId: string;
  entry?: TimeEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

const todayStr = () => new Date().toISOString().split("T")[0];

export function TimeEntryForm({ userId, entry, onSuccess, onCancel }: TimeEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    date: entry?.date ?? todayStr(),
    client: entry?.client ?? "",
    environment: entry?.environment ?? "",
    task: entry?.task ?? "",
    hours: entry?.hours?.toString() ?? "",
    description: entry?.description ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
    setError(null);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof typeof form, string>> = {};
    const hours = parseFloat(form.hours);

    if (!form.date) {
      errors.date = "La fecha es requerida.";
    } else if (form.date > todayStr()) {
      errors.date = "No se permiten fechas futuras.";
    }

    if (!form.hours || isNaN(hours) || hours <= 0)
      errors.hours = "Las horas son requeridas y deben ser mayores a 0.";
    else if (hours > 24)
      errors.hours = "No puedes registrar más de 24 horas en un día.";

    if (!form.client) errors.client = "El cliente es requerido.";
    if (!form.task) errors.task = "La tarea es requerida.";
    if (!form.environment) errors.environment = "El ambiente es requerido.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const hours = parseFloat(form.hours);
    setLoading(true);
    const supabase = createClient();

    // Check daily total (excluding current entry if editing)
    const { data: existing } = await supabase
      .from("time_entries")
      .select("hours")
      .eq("user_id", userId)
      .eq("date", form.date)
      .neq("id", entry?.id ?? "");

    const totalHours =
      (existing ?? []).reduce((s, e) => s + Number(e.hours), 0) + hours;

    if (totalHours > 24) {
      setFieldErrors((fe) => ({ ...fe, hours: "Superas el límite de 24 horas diarias con esta entrada." }));
      setLoading(false);
      return;
    }

    // Uppercase text fields before storing
    const payload = {
      user_id: userId,
      date: form.date,
      hours,
      client: form.client.toUpperCase(),
      environment: form.environment.toUpperCase(),
      task: form.task.toUpperCase(),
      description: form.description,
    };

    let err;
    if (entry) {
      const res = await supabase.from("time_entries").update(payload).eq("id", entry.id);
      err = res.error;
    } else {
      const res = await supabase.from("time_entries").insert(payload);
      err = res.error;
    }

    setLoading(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="date"
          label="Fecha *"
          type="date"
          max={todayStr()}
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          error={fieldErrors.date}
          required
        />
        <Input
          id="hours"
          label="Horas *"
          type="number"
          step="0.25"
          min="0.25"
          max="24"
          placeholder="0.0"
          value={form.hours}
          onChange={(e) => set("hours", e.target.value)}
          error={fieldErrors.hours}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="client"
          label="Cliente *"
          value={form.client}
          onChange={(e) => set("client", e.target.value)}
          placeholder="Seleccionar cliente"
          error={fieldErrors.client}
        >
          {CLIENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select
          id="task"
          label="Tarea *"
          value={form.task}
          onChange={(e) => set("task", e.target.value)}
          placeholder="Seleccionar tarea"
          error={fieldErrors.task}
        >
          {TASKS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>

      <Select
        id="environment"
        label="Ambiente *"
        value={form.environment}
        onChange={(e) => set("environment", e.target.value)}
        placeholder="Seleccionar ambiente"
        error={fieldErrors.environment}
      >
        {ENVIRONMENTS.map((env) => (
          <option key={env} value={env}>{env}</option>
        ))}
      </Select>

      <Textarea
        id="description"
        label="Descripción"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        placeholder="Detalle adicional..."
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {entry ? "Guardar cambios" : "Registrar horas"}
        </Button>
      </div>
    </form>
  );
}

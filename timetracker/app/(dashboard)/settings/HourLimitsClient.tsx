"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { HourLimit } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  initialLimits: HourLimit[];
}

interface LimitForm {
  country: string;
  daily_limit: string;
  weekly_limit: string;
  monthly_limit: string;
}

const emptyForm: LimitForm = {
  country: "",
  daily_limit: "",
  weekly_limit: "",
  monthly_limit: "",
};

export function HourLimitsClient({ initialLimits }: Props) {
  const [limits, setLimits] = useState<HourLimit[]>(initialLimits);
  const [form, setForm] = useState<LimitForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function startEdit(limit: HourLimit) {
    setEditId(limit.id);
    setForm({
      country: limit.country,
      daily_limit: limit.daily_limit.toString(),
      weekly_limit: limit.weekly_limit.toString(),
      monthly_limit: limit.monthly_limit.toString(),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSave() {
    if (!form.country.trim()) {
      setError("El país es requerido.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      country: form.country.trim().toUpperCase(),
      daily_limit: parseFloat(form.daily_limit) || 0,
      weekly_limit: parseFloat(form.weekly_limit) || 0,
      monthly_limit: parseFloat(form.monthly_limit) || 0,
    };

    const { data, error: err } = await supabase
      .from("hour_limits")
      .upsert(editId ? { id: editId, ...payload } : payload, { onConflict: "country" })
      .select()
      .single();

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }

    // Audit log via API
    await fetch("/api/admin/audit-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action_type: "UPDATE_LIMITS",
        description: `Leader updated hour limits for ${payload.country}`,
        metadata: payload,
      }),
    });

    setLimits((prev) => {
      const idx = prev.findIndex((l) => l.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = data as HourLimit;
        return next;
      }
      return [...prev, data as HourLimit];
    });

    setForm(emptyForm);
    setEditId(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          {editId ? "Editar límite" : "Agregar límite"}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Input
            id="country"
            label="País"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="Argentina"
            disabled={!!editId}
          />
          <Input
            id="daily"
            label="Límite diario (h)"
            type="number"
            step="0.5"
            value={form.daily_limit}
            onChange={(e) => setForm((f) => ({ ...f, daily_limit: e.target.value }))}
            placeholder="8"
          />
          <Input
            id="weekly"
            label="Límite semanal (h)"
            type="number"
            step="0.5"
            value={form.weekly_limit}
            onChange={(e) => setForm((f) => ({ ...f, weekly_limit: e.target.value }))}
            placeholder="40"
          />
          <Input
            id="monthly"
            label="Límite mensual (h)"
            type="number"
            step="0.5"
            value={form.monthly_limit}
            onChange={(e) => setForm((f) => ({ ...f, monthly_limit: e.target.value }))}
            placeholder="160"
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">Guardado correctamente.</p>}
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave} loading={loading}>
            {editId ? "Guardar cambios" : "Agregar"}
          </Button>
          {editId && (
            <Button variant="secondary" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Límites configurados</h2>
        </div>
        {limits.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No hay límites configurados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">País</th>
                <th className="px-6 py-3 text-right">Diario</th>
                <th className="px-6 py-3 text-right">Semanal</th>
                <th className="px-6 py-3 text-right">Mensual</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {limits.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{l.country}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{l.daily_limit}h</td>
                  <td className="px-6 py-3 text-right text-gray-600">{l.weekly_limit}h</td>
                  <td className="px-6 py-3 text-right text-gray-600">{l.monthly_limit}h</td>
                  <td className="px-6 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(l)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

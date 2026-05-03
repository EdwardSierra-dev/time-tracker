"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Props {
  countries: string[];
}

export function CompleteProfileForm({ countries }: Props) {
  const router = useRouter();
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!country) {
      setError("Debes seleccionar un país.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: err } = await supabase
      .from("profiles")
      .update({ country })
      .eq("id", user.id);

    setLoading(false);

    if (err) {
      setError("No se pudo guardar el país. Intenta nuevamente.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Completa tu perfil</h2>
          <p className="mt-1 text-sm text-gray-500">
            Necesitamos tu país para calcular correctamente los límites de horas.
          </p>
        </div>

        <Select
          id="country"
          label="País"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Selecciona tu país"
          required
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Guardar y continuar
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CLIENTS, ENVIRONMENTS } from "@/lib/constants";
import type { Profile, TimeEntryFilters } from "@/lib/types";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

interface FiltersBarProps {
  role: "LEAD" | "ANALYST";
  filters: TimeEntryFilters;
  onChange: (f: TimeEntryFilters) => void;
}

const todayStr = () => new Date().toISOString().split("T")[0];

export function FiltersBar({ role, filters, onChange }: FiltersBarProps) {
  const [analysts, setAnalysts] = useState<Profile[]>([]);

  useEffect(() => {
    if (role !== "LEAD") return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, full_name, role, country")
      .eq("role", "ANALYST")
      .order("full_name")
      .then(({ data }) => setAnalysts((data as Profile[]) ?? []));
  }, [role]);

  function set(field: keyof TimeEntryFilters, value: string) {
    onChange({ ...filters, [field]: value || undefined });
  }

  function reset() {
    onChange({});
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        id="dateFrom"
        label="Desde"
        type="date"
        max={todayStr()}
        value={filters.dateFrom ?? ""}
        onChange={(e) => set("dateFrom", e.target.value)}
        className="w-36"
      />
      <Input
        id="dateTo"
        label="Hasta"
        type="date"
        max={todayStr()}
        value={filters.dateTo ?? ""}
        onChange={(e) => set("dateTo", e.target.value)}
        className="w-36"
      />

      <Select
        id="client"
        label="Cliente"
        value={filters.client ?? ""}
        onChange={(e) => set("client", e.target.value)}
        placeholder="Todos"
        className="w-44"
      >
        {CLIENTS.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>

      <Select
        id="environment"
        label="Ambiente"
        value={filters.environment ?? ""}
        onChange={(e) => set("environment", e.target.value)}
        placeholder="Todos"
        className="w-52"
      >
        {ENVIRONMENTS.map((env) => (
          <option key={env} value={env}>{env}</option>
        ))}
      </Select>

      {role === "LEAD" && (
        <Select
          id="analyst"
          label="Analista"
          value={filters.analystId ?? ""}
          onChange={(e) => set("analystId", e.target.value)}
          placeholder="Todos"
          className="w-44"
        >
          {analysts.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name}</option>
          ))}
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="self-end">
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

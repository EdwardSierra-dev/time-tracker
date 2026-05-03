"use client";

import { useCallback, useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { CLIENTS, ENVIRONMENTS } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

interface EntryRow {
  analyst: string;
  country: string;
  date: string;
  hours: number;
  client: string;
  environment: string;
  description: string;
  user_id: string;
}

interface Filters {
  month: string;
  analystId: string;
  country: string;
  client: string;
  environment: string;
}

function currentMonth() {
  return format(new Date(), "yyyy-MM");
}

function exportXLSX(rows: EntryRow[], month: string) {
  const data = [
    ["Analista", "País", "Fecha", "Horas", "Cliente", "Ambiente", "Descripción"],
    ...rows.map((r) => [
      r.analyst,
      r.country,
      r.date,
      r.hours,
      r.client,
      r.environment || "N/A",
      r.description,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Entradas");
  XLSX.writeFile(wb, `timetracker_${month}.xlsx`);
}

export function LeadDashboard() {
  const [analysts, setAnalysts] = useState<Profile[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<EntryRow[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    month: currentMonth(),
    analystId: "",
    country: "",
    client: "",
    environment: "",
  });

  useEffect(() => {
    const supabase = createClient();

    // Load analysts
    supabase
      .from("profiles")
      .select("id, full_name, role, country")
      .eq("role", "ANALYST")
      .order("full_name")
      .then(({ data }) => {
        setAnalysts((data as Profile[]) ?? []);
      });

    // Load countries from hour_limits — the single source of truth for available countries
    supabase
      .from("hour_limits")
      .select("country")
      .order("country")
      .then(({ data }) => {
        const unique = [
          ...new Set(
            (data ?? [])
              .map((r) => r.country as string)
              .filter((c) => c && c.trim() !== "")
          ),
        ];
        setCountries(unique);
      });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [year, month] = filters.month.split("-").map(Number);
    const from = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
    const to = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

    let query = supabase
      .from("time_entries")
      .select("hours, user_id, date, client, environment, description, country, profiles!inner(full_name, country)")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });

    if (filters.analystId) query = query.eq("user_id", filters.analystId);
    if (filters.client) query = query.eq("client", filters.client);
    if (filters.environment) query = query.eq("environment", filters.environment);
    if (filters.country) query = query.eq("country", filters.country);

    const { data, error } = await query;

    if (error || !data) {
      setFilteredRows([]);
      setTotalHours(0);
      setLoading(false);
      return;
    }

    // Flatten individual rows (no aggregation)
    const rows: EntryRow[] = data.map((e) => {
      const profile = e.profiles as unknown as { full_name: string; country: string };
      return {
        analyst: profile?.full_name ?? "—",
        country: (e.country as string) || profile?.country || "—",
        date: e.date,
        hours: Number(e.hours),
        client: e.client ?? "",
        environment: e.environment ?? "",
        description: e.description ?? "",
        user_id: e.user_id,
      };
    });

    const total = rows.reduce((s, r) => s + r.hours, 0);
    setFilteredRows(rows);
    setTotalHours(total);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function setFilter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const hasActiveFilters =
    filters.analystId || filters.country || filters.client || filters.environment;

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard Global</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy")}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportXLSX(filteredRows, filters.month)}
          disabled={filteredRows.length === 0}
        >
          Exportar XLSX
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          id="month"
          label="Mes"
          value={filters.month}
          onChange={(e) => setFilter("month", e.target.value)}
          className="w-44"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        <Select
          id="analyst"
          label="Analista"
          value={filters.analystId}
          onChange={(e) => setFilter("analystId", e.target.value)}
          placeholder="Todos"
          className="w-48"
        >
          {analysts.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name}</option>
          ))}
        </Select>

        <Select
          id="country"
          label="País"
          value={filters.country}
          onChange={(e) => setFilter("country", e.target.value)}
          placeholder="Todos"
          className="w-40"
        >
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select
          id="client"
          label="Cliente"
          value={filters.client}
          onChange={(e) => setFilter("client", e.target.value)}
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
          value={filters.environment}
          onChange={(e) => setFilter("environment", e.target.value)}
          placeholder="Todos"
          className="w-52"
        >
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>{env}</option>
          ))}
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters((f) => ({
                ...f,
                analystId: "",
                country: "",
                client: "",
                environment: "",
              }))
            }
            className="self-end"
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Analistas activos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{analysts.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Entradas (filtro)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{filteredRows.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total horas (filtro)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Detalle de entradas</h2>
        </div>
        {loading ? (
          <PageSpinner />
        ) : filteredRows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">Sin registros para los filtros seleccionados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Analista</th>
                  <th className="px-4 py-3">País</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Ambiente</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((r, idx) => (
                  <tr key={`${r.user_id}-${r.date}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.analyst}</td>
                    <td className="px-4 py-3 text-gray-500">{r.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 text-gray-500">{r.client || "N/A"}</td>
                    <td className="px-4 py-3 text-gray-500">{r.environment || "N/A"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {r.hours.toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900" colSpan={5}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {totalHours.toFixed(1)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

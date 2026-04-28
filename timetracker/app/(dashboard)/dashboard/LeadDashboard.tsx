"use client";

import { useCallback, useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { CLIENTS } from "@/lib/constants";
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

interface AnalystSummary {
  id: string;
  name: string;
  country: string;
  hours: number;
  client: string;
  environment: string;
}

interface Filters {
  month: string;
  analystId: string;
  country: string;
  client: string;
}

function currentMonth() {
  return format(new Date(), "yyyy-MM");
}

function exportCSV(rows: EntryRow[], filters: Filters) {
  const headers = ["Analista", "País", "Fecha", "Horas", "Cliente", "Ambiente", "Descripción"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `"${r.analyst}"`,
        `"${r.country}"`,
        r.date,
        r.hours,
        `"${r.client}"`,
        `"${r.environment}"`,
        `"${r.description.replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timetracker_${filters.month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadDashboard() {
  const [analysts, setAnalysts] = useState<Profile[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<EntryRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<AnalystSummary[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    month: currentMonth(),
    analystId: "",
    country: "",
    client: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, full_name, role, country")
      .eq("role", "ANALYST")
      .order("full_name")
      .then(({ data }) => {
        const list = (data as Profile[]) ?? [];
        setAnalysts(list);
        const unique = Array.from(new Set(list.map((a) => a.country).filter(Boolean))).sort();
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
      .select("hours, user_id, date, client, environment, description, profiles!inner(full_name, country)")
      .gte("date", from)
      .lte("date", to);

    if (filters.analystId) query = query.eq("user_id", filters.analystId);
    if (filters.client) query = query.eq("client", filters.client);
    // country filter applied client-side after join
    const { data, error } = await query;

    if (error || !data) {
      setAllRows([]);
      setSummaryRows([]);
      setTotalHours(0);
      setLoading(false);
      return;
    }

    // Flatten rows
    let rows: EntryRow[] = data.map((e) => {
      const profile = e.profiles as unknown as { full_name: string; country: string };
      return {
        analyst: profile?.full_name ?? "—",
        country: profile?.country ?? "—",
        date: e.date,
        hours: Number(e.hours),
        client: e.client ?? "",
        environment: e.environment ?? "",
        description: e.description ?? "",
        user_id: e.user_id,
      };
    });

    // Apply country filter client-side (Supabase join filter limitation)
    if (filters.country) {
      rows = rows.filter((r) => r.country === filters.country);
    }

    // Aggregate per analyst — carry most recent client/environment
    const map = new Map<string, AnalystSummary>();
    for (const r of rows) {
      const prev = map.get(r.user_id) ?? { id: r.user_id, name: r.analyst, country: r.country, hours: 0, client: r.client, environment: r.environment };
      map.set(r.user_id, {
        ...prev,
        hours: prev.hours + r.hours,
        client: r.client || prev.client,
        environment: r.environment || prev.environment,
      });
    }

    const sorted = Array.from(map.values()).sort((a, b) => b.hours - a.hours);
    const total = sorted.reduce((s, r) => s + r.hours, 0);

    setAllRows(rows);
    setSummaryRows(sorted);
    setTotalHours(total);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function setFilter(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

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
          onClick={() => exportCSV(allRows, filters)}
          disabled={allRows.length === 0}
        >
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Select id="month" label="Mes" value={filters.month} onChange={(e) => setFilter("month", e.target.value)} className="w-44">
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>

        <Select id="analyst" label="Analista" value={filters.analystId} onChange={(e) => setFilter("analystId", e.target.value)} placeholder="Todos" className="w-48">
          {analysts.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name}</option>
          ))}
        </Select>

        <Select id="country" label="País" value={filters.country} onChange={(e) => setFilter("country", e.target.value)} placeholder="Todos" className="w-40">
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <Select id="client" label="Cliente" value={filters.client} onChange={(e) => setFilter("client", e.target.value)} placeholder="Todos" className="w-44">
          {CLIENTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        {(filters.analystId || filters.country || filters.client) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters((f) => ({ ...f, analystId: "", country: "", client: "" }))} className="self-end">
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
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Analistas con horas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summaryRows.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total horas (filtro)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Detalle por analista</h2>
        </div>
        {loading ? (
          <PageSpinner />
        ) : summaryRows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">Sin registros para los filtros seleccionados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Analista</th>
                  <th className="px-4 py-3">País</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Ambiente</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summaryRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{r.client || "N/A"}</td>
                    <td className="px-4 py-3 text-gray-500">{r.environment || "N/A"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{r.hours.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900" colSpan={4}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{totalHours.toFixed(1)}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TimeEntry, TimeEntryFilters } from "@/lib/types";

const PAGE_SIZE = 20;

export function useTimeEntries(filters: TimeEntryFilters = {}, page = 1) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("time_entries")
      .select("*, profiles(full_name), projects(name)", { count: "exact" })
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("date", filters.dateTo);
    if (filters.client) query = query.eq("client", filters.client);
    if (filters.environment) query = query.eq("environment", filters.environment);
    if (filters.analystId) query = query.eq("user_id", filters.analystId);
    if (filters.country) query = query.eq("country", filters.country);

    const { data, error: err, count } = await query;
    if (err) setError(err.message);
    else {
      setEntries((data as TimeEntry[]) ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.client,
    filters.environment,
    filters.analystId,
    filters.country,
    page,
  ]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, total, pageSize: PAGE_SIZE, loading, error, refetch: fetchEntries };
}

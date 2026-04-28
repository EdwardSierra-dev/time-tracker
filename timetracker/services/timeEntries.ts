import { createClient } from "@/lib/supabase/server";
import type { TimeEntry, TimeEntryFilters } from "@/lib/types";

export async function getTimeEntries(
  filters: TimeEntryFilters = {}
): Promise<TimeEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("time_entries")
    .select(
      "*, profiles(full_name), projects(name)"
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.client) query = query.ilike("client", `%${filters.client}%`);
  if (filters.analystId) query = query.eq("user_id", filters.analystId);

  const { data, error } = await query;
  if (error) return [];
  return data as TimeEntry[];
}

export async function createTimeEntry(
  entry: Omit<TimeEntry, "id" | "created_at" | "profiles" | "projects">
): Promise<{ data: TimeEntry | null; error: string | null }> {
  const supabase = await createClient();

  // Check daily total
  const { data: existing } = await supabase
    .from("time_entries")
    .select("hours")
    .eq("user_id", entry.user_id)
    .eq("date", entry.date);

  const totalHours =
    (existing ?? []).reduce((sum, e) => sum + Number(e.hours), 0) +
    Number(entry.hours);

  if (totalHours > 24) {
    return { data: null, error: "No puedes registrar más de 24 horas en un día." };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert(entry)
    .select("*, profiles(full_name), projects(name)")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as TimeEntry, error: null };
}

export async function updateTimeEntry(
  id: string,
  updates: Partial<Omit<TimeEntry, "id" | "created_at" | "profiles" | "projects">>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteTimeEntry(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function getHoursSummary(
  userId: string,
  today: string,
  weekStart: string,
  monthStart: string
): Promise<{ daily: number; weekly: number; monthly: number }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("time_entries")
    .select("date, hours")
    .eq("user_id", userId)
    .gte("date", monthStart)
    .lte("date", today);

  const entries = data ?? [];

  const daily = entries
    .filter((e) => e.date === today)
    .reduce((s, e) => s + Number(e.hours), 0);

  const weekly = entries
    .filter((e) => e.date >= weekStart)
    .reduce((s, e) => s + Number(e.hours), 0);

  const monthly = entries.reduce((s, e) => s + Number(e.hours), 0);

  return { daily, weekly, monthly };
}

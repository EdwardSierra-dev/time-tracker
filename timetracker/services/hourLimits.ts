import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HourLimit } from "@/lib/types";

/**
 * Returns the list of unique countries from hour_limits, sorted alphabetically.
 * Uses the admin client so it works in both authenticated and public contexts
 * (e.g. the registration page where the user has no session yet).
 * This is the single source of truth for country selection across the app.
 */
export async function getCountries(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hour_limits")
    .select("country")
    .order("country");

  if (error || !data) return [];

  // Deduplicate in case the DB constraint is ever relaxed
  return [...new Set(data.map((r) => r.country as string))];
}

export async function getHourLimitByCountry(
  country: string
): Promise<HourLimit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hour_limits")
    .select("*")
    .eq("country", country)
    .single();

  if (error) return null;
  return data as HourLimit;
}

export async function getAllHourLimits(): Promise<HourLimit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hour_limits")
    .select("*")
    .order("country");

  if (error) return [];
  return data as HourLimit[];
}

export async function upsertHourLimit(
  limit: Omit<HourLimit, "id"> & { id?: string }
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("hour_limits").upsert(limit, {
    onConflict: "country",
  });
  if (error) return { error: error.message };
  return { error: null };
}

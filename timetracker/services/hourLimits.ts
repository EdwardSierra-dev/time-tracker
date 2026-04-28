import { createClient } from "@/lib/supabase/server";
import type { HourLimit } from "@/lib/types";

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

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data as Profile;
}

/**
 * Ensures a profile exists for the given auth user.
 * Creates one with safe defaults on first login if the DB trigger didn't fire
 * (e.g. user created via Supabase dashboard without metadata).
 */
export async function upsertProfile(userId: string, email: string): Promise<Profile | null> {
  const supabase = await createClient();

  // Try to load existing profile first
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (existing) return existing as Profile;

  // Profile does not exist — create it with safe defaults
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: email.split("@")[0],
      role: "ANALYST",
      country: null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("[upsertProfile] Failed to create profile:", error.message);
    return null;
  }

  return created as Profile;
}

/**
 * Updates the country for a given profile.
 * Called from the Complete Profile page after first login.
 */
export async function updateProfileCountry(
  userId: string,
  country: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ country: country.trim().toUpperCase() })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getAllAnalysts(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, country, email, created_at")
    .eq("role", "ANALYST")
    .order("full_name");

  if (error) return [];
  return data as Profile[];
}

import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  if (error) return [];
  return data as Project[];
}

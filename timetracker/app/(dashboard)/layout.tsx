import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/services/profiles";
import { Navbar } from "@/components/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Ensure profile exists — creates it on first login if the DB trigger didn't fire
  const profile = await upsertProfile(user.id, user.email ?? "");
  if (!profile) redirect("/login");

  // Country is required for hour tracking — send user to complete their profile
  if (!profile.country) redirect("/complete-profile");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

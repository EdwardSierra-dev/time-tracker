import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profiles";
import { getCountries } from "@/services/hourLimits";
import { CompleteProfileForm } from "./CompleteProfileForm";

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  // Already has a country — nothing to complete
  if (profile.country) redirect("/dashboard");

  const countries = await getCountries();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-600">TimeTracker</h1>
          <p className="mt-1 text-sm text-gray-500">Un último paso antes de continuar</p>
        </div>
        <CompleteProfileForm countries={countries} />
      </div>
    </div>
  );
}

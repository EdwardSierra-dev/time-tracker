import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profiles";
import { getAllHourLimits } from "@/services/hourLimits";
import { HourLimitsClient } from "./HourLimitsClient";
import { CreateAnalystForm } from "@/components/CreateAnalystForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function SettingsPage() {
  // Role is resolved server-side from the DB — cannot be spoofed via URL or client state
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  const isLead = profile.role === "LEAD";
  const isAnalyst = profile.role === "ANALYST";
  const limits = isLead ? await getAllHourLimits() : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isLead
            ? "Gestión de usuarios y configuración del sistema"
            : "Configuración de tu cuenta"}
        </p>
      </div>

      {/* LEAD-only sections */}
      {isLead && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-gray-800">Usuarios</h2>
            <CreateAnalystForm />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-gray-800">Límites de horas por país</h2>
            <HourLimitsClient initialLimits={limits} />
          </section>
        </>
      )}

      {/* ANALYST-only: password change */}
      {isAnalyst && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-gray-800">Seguridad</h2>
          <ChangePasswordForm />
        </section>
      )}
    </div>
  );
}

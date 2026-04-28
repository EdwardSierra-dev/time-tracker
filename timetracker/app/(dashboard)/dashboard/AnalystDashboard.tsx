import { startOfWeek, startOfMonth, format } from "date-fns";
import { getHoursSummary } from "@/services/timeEntries";
import { getHourLimitByCountry } from "@/services/hourLimits";
import type { Profile } from "@/lib/types";
import { CircularProgress } from "@/components/CircularProgress";
import { Card } from "@/components/ui/Card";

interface Props {
  profile: Profile;
}

export async function AnalystDashboard({ profile }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [summary, limits] = await Promise.all([
    getHoursSummary(profile.id, today, weekStart, monthStart),
    getHourLimitByCountry(profile.country),
  ]);

  const dailyLimit = limits?.daily_limit ?? 0;
  const weeklyLimit = limits?.weekly_limit ?? 0;
  const monthlyLimit = limits?.monthly_limit ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Mi Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Hola, {profile.full_name} — {format(new Date(), "EEEE d 'de' MMMM")}
        </p>
      </div>

      {/* Country label */}
      <div className="flex justify-center">
        <span className="rounded-full bg-blue-50 px-5 py-1.5 text-sm font-semibold tracking-widest text-blue-700 uppercase">
          {profile.country}
        </span>
      </div>

      {/* Circular progress charts */}
      <Card className="p-6">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-500 text-center">
          Progreso de horas
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <CircularProgress
            label="Hoy"
            current={summary.daily}
            limit={dailyLimit}
          />
          <CircularProgress
            label="Esta semana"
            current={summary.weekly}
            limit={weeklyLimit}
          />
          <CircularProgress
            label="Este mes"
            current={summary.monthly}
            limit={monthlyLimit}
          />
        </div>
      </Card>
    </div>
  );
}

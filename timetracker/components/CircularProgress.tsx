interface CircularProgressProps {
  label: string;
  current: number;
  limit: number;
}

export function CircularProgress({ label, current, limit }: CircularProgressProps) {
  const pct = limit > 0 ? Math.round(Math.min((current / limit) * 100, 100)) : 0;
  const over = limit > 0 && current > limit;

  // SVG circle math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const trackColor = "#e5e7eb"; // gray-200
  const fillColor = over ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#3b82f6";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
          {/* Track */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={fillColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-lg font-bold leading-none"
            style={{ color: fillColor }}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-700">
          {current.toFixed(1)}h
          {limit > 0 && <span className="text-gray-400"> / {limit}h</span>}
        </p>
        {over && (
          <p className="text-xs text-red-500">+{(current - limit).toFixed(1)}h excedido</p>
        )}
      </div>
    </div>
  );
}

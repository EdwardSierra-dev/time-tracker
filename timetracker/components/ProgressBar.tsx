interface ProgressBarProps {
  label: string;
  current: number;
  limit: number;
}

export function ProgressBar({ label, current, limit }: ProgressBarProps) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const over = current > limit;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${over ? "text-red-600" : "text-gray-900"}`}>
          {current.toFixed(1)}h / {limit}h
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            over ? "bg-red-500" : pct >= 80 ? "bg-yellow-400" : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over && (
        <p className="text-xs text-red-500">
          Excediste el límite por {(current - limit).toFixed(1)}h
        </p>
      )}
    </div>
  );
}

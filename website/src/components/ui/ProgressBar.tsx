import { cn } from "@/lib/cn";

type Tone = "primary" | "success" | "warning";
const FILL: Record<Tone, string> = {
  primary: "bg-gradient-to-r from-primary to-accent-violet",
  success: "bg-success",
  warning: "bg-warning",
};
const HEIGHT = { xs: "h-1", sm: "h-1.5", md: "h-2.5" } as const;

/**
 * Linear progress. `value` / `max` are clamped; the fill animates in once on
 * mount (CSS only — neutralised by the reduced-motion guard). Always pass a
 * `label` — it becomes the accessible name, and is shown when `showLabel`.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = false,
  size = "sm",
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  label: string;
  showLabel?: boolean;
  size?: keyof typeof HEIGHT;
  tone?: Tone;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.round(Math.min(100, Math.max(0, (value / safeMax) * 100)));
  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-muted">
          <span>{label}</span>
          <span className="tabular-nums text-ink">{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className={cn("w-full overflow-hidden rounded-full bg-line/70", HEIGHT[size])}
      >
        <div
          className={cn("h-full origin-left animate-progress-fill rounded-full", FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Circular progress with the percentage in the middle — the ring version of
 * <ProgressBar>, same brand gradient (or solid success when complete). Always
 * pass a `label`; it becomes the accessible name.
 */
export function ProgressRing({
  value,
  max = 100,
  label,
  size = 96,
  stroke = 9,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  label: string;
  size?: number;
  stroke?: number;
  tone?: "primary" | "success";
  className?: string;
}) {
  const gradientId = useId();
  const safeMax = max > 0 ? max : 1;
  const pct = Math.round(Math.min(100, Math.max(0, (value / safeMax) * 100)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("relative inline-flex flex-shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--primary))" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line/70" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={tone === "success" ? "rgb(var(--success))" : `url(#${gradientId})`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold tabular-nums leading-none text-ink">
          {pct}
          <span className="text-sm font-semibold text-ink-muted">%</span>
        </span>
      </span>
    </div>
  );
}

export default ProgressRing;

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { href: "/custom-projects/start", label: "Details" },
  { href: "/custom-projects/features", label: "Features & files" },
  { href: "/custom-projects/estimate", label: "Estimate" },
  { href: "/custom-projects/checkout", label: "Payment" },
];

/**
 * Wizard step indicator. Completed and current steps stay clickable (same
 * behaviour as before); future steps are plain text. A progress fill + a
 * "Step X of 4 · label" line keep it readable on phones.
 */
export default function StepBar({ current }: { current: 0 | 1 | 2 | 3 }) {
  const pct = Math.round((current / (STEPS.length - 1)) * 100);
  return (
    <nav aria-label="Project request steps" className="mb-8 rounded-2xl border border-line bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <p className="text-sm font-semibold text-ink">{STEPS[current].label}</p>
        <p className="text-xs font-semibold text-ink-faint">
          Step {current + 1} of {STEPS.length}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line sm:hidden" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet" style={{ width: `${Math.max(8, pct)}%` }} />
      </div>

      <ol className="hidden items-center gap-3 sm:flex">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const marker = (
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                  done
                    ? "border-primary bg-primary text-white"
                    : active
                      ? "border-primary bg-primary-50 text-primary shadow-glow"
                      : "border-line bg-card text-ink-faint",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className={cn("text-sm font-semibold", active ? "text-ink" : done ? "text-ink-muted" : "text-ink-faint")}>
                {s.label}
              </span>
            </span>
          );
          return (
            <li key={s.href} className="flex flex-1 items-center gap-3 last:flex-none">
              {i <= current ? (
                <Link href={s.href} aria-current={active ? "step" : undefined} className="rounded-lg">
                  {marker}
                </Link>
              ) : (
                marker
              )}
              {i < STEPS.length - 1 && <span className={cn("h-0.5 flex-1 rounded-full", done ? "bg-primary" : "bg-line")} aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

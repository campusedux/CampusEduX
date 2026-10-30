import { cn } from "@/lib/cn";

/**
 * Small status pill. `premium` = amber, `success` = green (BESTSELLER / done),
 * `new` / `trending` for discovery rails, plus neutral / primary / danger.
 */
export type BadgeTone = "primary" | "premium" | "success" | "neutral" | "danger" | "new" | "trending";

const TONE: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary",
  premium: "bg-warning/15 text-amber-800 dark:text-amber-300",
  success: "bg-success/15 text-success",
  neutral: "bg-surface text-ink-muted border border-line",
  danger: "bg-danger/10 text-danger",
  new: "bg-accent-teal/15 text-teal-700 dark:text-teal-300",
  trending: "bg-accent-pink/15 text-pink-700 dark:text-pink-300",
};

export function Badge({
  tone = "neutral",
  variant,
  className,
  children,
}: {
  tone?: BadgeTone;
  variant?: "free" | "pro" | "new" | "popular";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 min-w-0 max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase leading-4 tracking-wide [overflow-wrap:anywhere]",
        TONE[variant ? ({ free: "success", pro: "premium", new: "new", popular: "neutral" } as const)[variant] : tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;

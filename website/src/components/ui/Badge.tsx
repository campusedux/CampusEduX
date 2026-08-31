import { cn } from "@/lib/cn";

/**
 * Small status pill. `premium` = amber (app "PREMIUM"), `success` = green
 * (app "BESTSELLER" / "NEW"), plus neutral / primary / danger tones.
 */
export type BadgeTone = "primary" | "premium" | "success" | "neutral" | "danger";

const TONE: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary",
  premium: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
  neutral: "bg-surface text-ink-muted border border-line",
  danger: "bg-danger/10 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;

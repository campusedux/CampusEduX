import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Friendly empty state: an icon in a soft brand bubble, a title, an optional
 * one-line hint, and an optional `action` slot for a CTA (e.g. "Browse projects").
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-2xl bg-primary-50 rotate-6" />
        <span aria-hidden className="absolute inset-0 rounded-2xl border border-primary-100 bg-card" />
        <Icon className="relative h-7 w-7 text-primary" aria-hidden />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-ink-muted">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;

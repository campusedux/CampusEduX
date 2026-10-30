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
  text,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  text?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "discovery-empty flex min-w-0 flex-col items-center justify-center rounded-2xl border border-line bg-card px-4 py-10 text-center [overflow-wrap:anywhere] sm:px-6 sm:py-14",
        className,
      )}
    >
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-2xl bg-primary-50 rotate-6" />
        <span aria-hidden className="absolute inset-0 rounded-2xl border border-primary-100 bg-card" />
        <Icon className="relative h-7 w-7 text-primary" aria-hidden />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink">{title}</p>
      {(text ?? subtitle) && <p className="mt-1 max-w-sm text-sm text-ink-muted">{text ?? subtitle}</p>}
      {(actions ?? action) && <div className="mt-5 flex max-w-full flex-wrap justify-center gap-2">{actions ?? action}</div>}
    </div>
  );
}

export default EmptyState;

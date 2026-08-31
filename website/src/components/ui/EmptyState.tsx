import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Polished empty state — mirrors `mobile-app/src/components/ui/StateViews.tsx`
 * `EmptyState`. Optional `action` slot for a CTA (e.g. "Browse projects").
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
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <Icon className="h-9 w-9 text-ink-faint" aria-hidden />
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-ink-muted">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;

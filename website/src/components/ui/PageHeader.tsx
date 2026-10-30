import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

/**
 * Standard page-title block — a small uppercase eyebrow, an <h1>, and an
 * optional muted description. Presentation only; pages keep their own data and
 * layout around it. Use on list / landing pages so the title rhythm is
 * identical across Projects / Jobs / Learning / Resume / Premium.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  caption,
  action,
  icon: Icon,
  iconClassName,
  id,
  className,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  caption?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("page-header flex min-w-0 flex-wrap items-start justify-between gap-2", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {Icon && <Icon className={cn("mt-1 h-5 w-5 shrink-0", iconClassName ?? "text-ink-muted")} aria-hidden />}
        <div className="min-w-0 max-w-2xl flex-1 [overflow-wrap:anywhere]">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1
            id={id}
            className={cn(
              "line-clamp-2 text-2xl font-semibold leading-tight tracking-tight text-ink md:text-[28px]",
              eyebrow && "mt-2.5",
            )}
          >
            {title}
          </h1>
          {(caption ?? description) && <p className="mt-1 text-sm leading-5 text-ink-muted md:text-base">{caption ?? description}</p>}
          {children}
        </div>
      </div>
      {action && <div className="min-w-0 max-w-full shrink-0">{action}</div>}
    </header>
  );
}

export default PageHeader;

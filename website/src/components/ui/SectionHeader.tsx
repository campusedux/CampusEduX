import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Section title with an optional eyebrow, one-line description, and either a
 * "View all" link or a custom `action` slot (e.g. tabs or a button).
 */
export function SectionHeader({
  title,
  eyebrow,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  action,
  as: Heading = "h2",
  id,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  action?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  /** Id for the heading, so a `<section aria-labelledby>` can point at it. */
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 max-md:mb-4 max-md:items-start max-md:gap-x-2 max-md:gap-y-1", className)}>
      <div className="min-w-0 max-w-2xl max-md:flex-1">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <Heading id={id} className="h-section">
          {title}
        </Heading>
        {description && <p className="mt-1.5 text-sm text-ink-muted md:text-base">{description}</p>}
      </div>
      {action}
      {!action && viewAllHref && (
        <Link
          href={viewAllHref}
          className="group inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-lg text-sm font-semibold text-ink-muted transition hover:text-primary-700 max-md:text-xs"
        >
          {viewAllLabel}
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

/**
 * Presentational breadcrumb trail — `Home › … › current`. Pure markup, no data
 * fetching. The last item renders as plain text; earlier items with an `href`
 * render as links. Used on detail pages for a consistent
 * breadcrumb → title → metadata → content order.
 */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const trail: Crumb[] = items[0]?.href === "/" || items[0]?.label === "Home"
    ? items
    : [{ label: "Home", href: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-sm text-ink-faint", className)}>
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />}
            {c.href && !last ? (
              <Link href={c.href} className="transition-colors hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className={cn("truncate", last && "text-ink-muted")} aria-current={last ? "page" : undefined}>
                {c.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;

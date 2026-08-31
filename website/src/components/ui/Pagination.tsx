import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Server-friendly pagination — emits `<Link>`s that set `?page=`. Preserves the
 * other query params passed in `params`.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
  const pages = Array.from({ length: Math.min(windowSize, totalPages) }, (_, i) => start + i);

  const cell = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium";

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(cell, "border border-line text-ink hover:bg-surface")} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(cell, "border border-line text-ink-faint")} aria-disabled>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(cell, p === page ? "bg-primary text-white" : "border border-line text-ink hover:bg-surface")}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(cell, "border border-line text-ink hover:bg-surface")} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={cn(cell, "border border-line text-ink-faint")} aria-disabled>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

export default Pagination;

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Section title with an optional "View all" link — mirrors
 * `mobile-app/src/components/ui/SectionHeader.tsx`.
 */
export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-center justify-between gap-4", className)}>
      <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:text-primary-700"
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;

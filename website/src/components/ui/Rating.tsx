import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Read-only star rating — mirrors `mobile-app/src/components/ui/RatingStars.tsx`
 * (amber stars). Shows "No ratings yet" when `count` is 0 and `showEmpty`.
 */
export function Rating({
  value,
  count,
  size = 14,
  showCount = true,
  showEmpty = false,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  showEmpty?: boolean;
  className?: string;
}) {
  if ((!value || value <= 0) && showEmpty) {
    return <span className={cn("text-xs text-ink-faint", className)}>No ratings yet</span>;
  }

  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="inline-flex" style={{ gap: 1 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={n <= rounded ? "fill-warning text-warning" : "text-line"}
            aria-hidden
          />
        ))}
      </span>
      {showCount && (
        <span className="text-xs text-ink-muted">
          {value.toFixed(1)}
          {typeof count === "number" && <span className="text-ink-faint"> ({count})</span>}
        </span>
      )}
    </span>
  );
}

export default Rating;

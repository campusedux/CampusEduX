import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Price with optional strike-through original price + discount badge.
 * `price === 0` renders "Free".
 */
export function PriceDisplay({
  price,
  originalPrice,
  size = "md",
  className,
}: {
  price: number;
  originalPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasDiscount = typeof originalPrice === "number" && originalPrice > price && price > 0;
  const pct = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;
  const priceClass = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size];

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn("font-bold text-primary", priceClass)}>{price > 0 ? formatINR(price) : "Free"}</span>
      {hasDiscount && (
        <>
          <span className="text-xs text-ink-faint line-through">{formatINR(originalPrice!)}</span>
          <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-success">
            {pct}% off
          </span>
        </>
      )}
    </span>
  );
}

export default PriceDisplay;

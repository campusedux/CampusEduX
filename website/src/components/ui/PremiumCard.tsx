import { Check } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

export type PremiumPlanData = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  period_label?: string | null; // e.g. "per year", "one-time"
  features?: string[] | null;
  is_popular?: boolean | null;
};

/**
 * Premium plan card. `highlighted` (or `plan.is_popular`) gives the popular
 * plan an indigo ring + badge. `cta` is the subscribe control (client island).
 */
export function PremiumCard({
  plan,
  highlighted,
  subNote,
  cta,
  className,
}: {
  plan: PremiumPlanData;
  highlighted?: boolean;
  subNote?: string;
  cta?: React.ReactNode;
  className?: string;
}) {
  const popular = highlighted ?? plan.is_popular ?? false;
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-6 shadow-card",
        popular ? "border-primary ring-1 ring-primary" : "border-line",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
        {popular && <Badge tone="primary">Popular</Badge>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-ink">{plan.price > 0 ? formatINR(plan.price) : "Free"}</span>
        {plan.period_label && <span className="text-sm text-ink-muted">{plan.period_label}</span>}
      </div>
      {typeof plan.original_price === "number" && plan.original_price > plan.price && (
        <span className="mt-1 text-xs text-ink-faint line-through">{formatINR(plan.original_price)}</span>
      )}
      {subNote && <p className="mt-1 text-xs text-ink-faint">{subNote}</p>}
      {plan.features && plan.features.length > 0 && (
        <ul className="mt-4 flex-1 space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

export default PremiumCard;

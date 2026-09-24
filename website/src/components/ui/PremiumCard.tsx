import { Check, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

export type PremiumPlanData = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  period_label?: string | null; // e.g. "/ month", "one-time"
  features?: string[] | null;
  is_popular?: boolean | null;
};

/**
 * Premium plan card. The recommended plan (`highlighted`, or `plan.is_popular`
 * from the admin) gets a gradient frame, a "Recommended" ribbon and a lift.
 * `cta` is the subscribe control (client island) — rendered as-is.
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
        "relative flex flex-col rounded-3xl p-[1.5px] transition",
        popular ? "bg-gradient-to-br from-primary via-accent-violet to-accent-pink shadow-glow lg:-translate-y-2" : "bg-line",
        className,
      )}
    >
      <div className="relative flex flex-1 flex-col rounded-[calc(1.5rem-1.5px)] bg-card p-6 sm:p-7">
        {popular && (
          <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-accent-violet px-3.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white shadow-glow">
            <Sparkles className="h-3 w-3" aria-hidden />
            Recommended
          </span>
        )}
        <h3 className="font-display text-xl font-bold text-ink">{plan.name}</h3>
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tracking-tight text-ink">
            {plan.price > 0 ? formatINR(plan.price) : "Free"}
          </span>
          {plan.period_label && <span className="text-sm text-ink-muted">{plan.period_label}</span>}
        </div>
        {typeof plan.original_price === "number" && plan.original_price > plan.price && (
          <span className="mt-1 text-xs text-ink-faint line-through">{formatINR(plan.original_price)}</span>
        )}
        {subNote && <p className="mt-1.5 text-xs font-medium text-success">{subNote}</p>}
        {plan.features && plan.features.length > 0 && (
          <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-5">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-3 w-3 text-success" strokeWidth={3} aria-hidden />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
        {cta && <div className="mt-6">{cta}</div>}
      </div>
    </div>
  );
}

export default PremiumCard;

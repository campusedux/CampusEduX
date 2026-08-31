import { Tag } from "lucide-react";

export interface OfferBanner {
  id: string;
  title: string;
  description: string;
  discount_label: string;
  coupon_code: string;
}

/** Horizontal offers strip driven by `offer_banners` (is_active). */
export function OffersStrip({ offers }: { offers: OfferBanner[] }) {
  if (offers.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {offers.map((o) => (
          <div
            key={o.id}
            className="flex min-w-[240px] max-w-xs flex-1 items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning/20">
              <Tag className="h-4 w-4 text-warning" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-ink">{o.title}</span>
                {o.discount_label && (
                  <span className="rounded-md bg-warning px-1.5 py-0.5 text-[0.65rem] font-bold text-[#78350F]">
                    {o.discount_label}
                  </span>
                )}
              </div>
              {o.description && <p className="mt-0.5 truncate text-xs text-ink-muted">{o.description}</p>}
              {o.coupon_code && (
                <p className="mt-1 text-xs text-ink-muted">
                  Code <span className="font-mono font-semibold text-ink">{o.coupon_code}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OffersStrip;

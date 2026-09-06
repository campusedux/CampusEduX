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
    <section className="container-page pt-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => (
          <div
            key={o.id}
            className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4"
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

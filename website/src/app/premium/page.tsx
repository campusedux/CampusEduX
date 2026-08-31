import { getPublicSupabase } from "@/lib/supabase/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { PremiumCard, SectionHeader, EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/format";
import PremiumSubscribeButton from "@/components/PremiumSubscribeButton";

export const revalidate = 300;
export const metadata = { title: "Premium" };

type Plan = {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  yearly_discount_percent: number;
  features: string[] | null;
  is_popular: boolean | null;
};
type Feature = { id: string; title: string; subtitle: string | null };

export default async function PremiumPage() {
  const supabase = getPublicSupabase();
  let plans: Plan[] = [];
  let features: Feature[] = [];
  if (supabase) {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("premium_plans").select("*").order("sort_order"),
      supabase.from("premium_features").select("*").order("sort_order"),
    ]);
    plans = (p ?? []) as Plan[];
    features = (f ?? []) as Feature[];
  }

  const { data: { user } } = await createAuthedServerSupabase().auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Premium</h1>
      <p className="mt-2 max-w-2xl text-ink-muted">
        An optional tier on top of everything already free in CampusEduX — priority access, extra prep material and
        faster support. Same account across web and the app.
      </p>

      {features.length > 0 && (
        <div className="mt-8">
          <SectionHeader title="What you get" />
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <div className="font-semibold text-ink">{f.title}</div>
                {f.subtitle && <p className="mt-1 text-sm text-ink-muted">{f.subtitle}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <SectionHeader title="Plans" />
        {plans.length === 0 ? (
          <EmptyState title="Plan pricing coming soon" subtitle="Plans appear here once published from the admin panel." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            {plans.map((p) => (
              <PremiumCard
                key={p.id}
                plan={{
                  id: p.id,
                  name: p.name,
                  price: Number(p.monthly_price) || 0,
                  period_label: "/ month",
                  features: p.features ?? [],
                  is_popular: p.is_popular ?? false,
                }}
                subNote={`or ${formatINR(p.yearly_price)}/yr${p.yearly_discount_percent > 0 ? ` · save ${p.yearly_discount_percent}%` : ""}`}
                cta={<PremiumSubscribeButton planId={p.id} planName={p.name} isSignedIn={!!user} />}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

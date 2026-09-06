import { getPublicSupabase } from "@/lib/supabase/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { PremiumCard, SectionHeader, EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/format";
import PremiumSubscribeButton from "@/components/PremiumSubscribeButton";
import { Sparkles, Zap, BookOpen, Headphones, Crown, ShieldCheck } from "lucide-react";

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

const FEATURE_ICONS = [Sparkles, Zap, BookOpen, Headphones, Crown, ShieldCheck];

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
    <div className="container-page py-10 sm:py-12">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary-50 via-white to-primary-50/50 px-6 py-10 text-center sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Premium</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          Go further, faster.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-muted">
          An optional tier on top of everything already free in CampusEduX — priority access, extra prep material and
          faster support.
        </p>
        <p className="mt-3 text-xs font-medium text-ink-faint">One subscription, same account across web and the app.</p>
      </section>

      {/* Benefits */}
      {features.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="What you get" />
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={f.id} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{f.title}</div>
                    {f.subtitle && <p className="mt-1 text-sm text-ink-muted">{f.subtitle}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Plans */}
      <section className="mt-12">
        <SectionHeader title="Plans" />
        {plans.length === 0 ? (
          <EmptyState title="Plan pricing coming soon" subtitle="Plans appear here once published from the admin panel." />
        ) : (
          <div className="grid gap-5 pt-3 sm:grid-cols-3">
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
        <p className="mt-6 text-center text-xs text-ink-faint">
          Payments are processed securely through Razorpay. Everything already free in CampusEduX stays free.
        </p>
      </section>
    </div>
  );
}

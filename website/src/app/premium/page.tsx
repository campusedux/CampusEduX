import type { Metadata } from "next";
import { getPublicSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { PremiumCard, SectionHeader, EmptyState } from "@/components/ui";
import { formatINR } from "@/lib/format";
import PremiumSubscribeButton from "@/components/PremiumSubscribeButton";
import { Sparkles, Zap, BookOpen, Headphones, Crown, ShieldCheck, Check, Minus, Plus, Lock, Smartphone, ArrowDown } from "lucide-react";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

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

async function getPremiumData(): Promise<{ plans: Plan[]; features: Feature[] }> {
  const supabase = getPublicSupabase();
  if (!supabase) return { plans: [], features: [] };
  const [{ data: p }, { data: f }] = await Promise.all([
    supabase
      .from("premium_plans")
      .select("id,name,monthly_price,yearly_price,yearly_discount_percent,features,is_popular")
      .order("sort_order"),
    supabase.from("premium_features").select("id,title,subtitle").order("sort_order"),
  ]);
  return { plans: (p ?? []) as Plan[], features: (f ?? []) as Feature[] };
}

export async function generateMetadata(): Promise<Metadata> {
  const { plans } = await getPremiumData();
  return {
    title: "Premium",
    alternates: { canonical: absoluteUrl("/premium") },
    // No plans published yet -> don't index a page with no pricing to show.
    robots: plans.length === 0 ? { index: false, follow: true } : undefined,
  };
}

/**
 * Questions answered only with what the site already states (this page's own
 * copy, the refund policy link) — no invented terms, prices or guarantees.
 */
const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Does Premium work in the CampusEduX app too?",
    a: "Yes — it's one subscription on one account, shared across the website and the app.",
  },
  {
    q: "What stays free if I don't upgrade?",
    a: "Everything that's already free in CampusEduX stays free. Premium adds more on top.",
  },
  {
    q: "How do I pay?",
    a: "Payments are processed securely through Razorpay when you subscribe.",
  },
  {
    q: "Can I pick monthly or yearly billing?",
    a: "Yes — choose monthly or yearly on the plan card before you subscribe. Yearly prices are shown under each plan.",
  },
  {
    q: "What if I need a refund?",
    a: (
      <>
        Refunds follow our{" "}
        <Link href="/refund-policy" className="font-semibold text-primary hover:text-primary-700">
          Refund Policy
        </Link>
        .
      </>
    ),
  },
];

export default async function PremiumPage() {
  const { plans, features } = await getPremiumData();
  // Comparison rows = the union of the plans' own feature strings, in first-seen order.
  const allFeatures = [...new Set(plans.flatMap((p) => p.features ?? []))];
  const recommended = plans.find((p) => p.is_popular);

  return (
    <div className="page-shell">
      {/* Hero — fixed dark panel in both themes */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F0B2E] px-6 py-12 text-center text-white shadow-card-lg sm:px-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-72 w-80 rounded-full bg-warning/25 blur-3xl" />
        <div className="relative">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-warning to-accent-pink shadow-glow">
            <Crown className="h-7 w-7 text-white" aria-hidden />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#C9C2FF]">CampusEduX Premium</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-[2.25rem] font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Go further, <span className="bg-gradient-to-r from-[#FFD27A] to-[#FF8FC7] bg-clip-text text-transparent">faster.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/75 sm:text-base">
            One subscription, same account across web and the app. Everything already free stays free.
          </p>
          {plans.length > 0 && (
            <a
              href="#plans"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[0.95rem] font-semibold text-[#2A1FA8] shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
            >
              {recommended ? `See plans — from ${formatINR(Math.min(...plans.map((p) => Number(p.monthly_price) || 0)))}/month` : "See plans"}
              <ArrowDown className="h-4 w-4" aria-hidden />
            </a>
          )}
          <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
            <li className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4" aria-hidden /> Secure payments via Razorpay
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" aria-hidden /> Works on web &amp; app
            </li>
          </ul>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="scroll-mt-24 pt-14" aria-labelledby="plans-title">
        <SectionHeader id="plans-title" eyebrow="Pricing" title="Choose your plan" className="justify-center text-center [&>div]:mx-auto" />
        {plans.length === 0 ? (
          <EmptyState title="Plan pricing coming soon" subtitle="Plans appear here once published from the admin panel." />
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 pt-4 md:grid-cols-3 md:items-stretch">
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
                cta={<PremiumSubscribeButton planId={p.id} planName={p.name} />}
              />
            ))}
          </div>
        )}
        <p className="mt-6 text-center text-xs text-ink-faint">
          Payments are processed securely through Razorpay. Everything already free in CampusEduX stays free.
        </p>
      </section>

      {/* Benefits */}
      {features.length > 0 && (
        <section className="mt-16" aria-labelledby="benefits-title">
          <SectionHeader id="benefits-title" eyebrow="Benefits" title="What Premium unlocks" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={f.id} className="card flex gap-4 p-5">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warning/20 to-accent-pink/15">
                    <Icon className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden />
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

      {/* Comparison — prices + each plan's own features, exactly as published */}
      {plans.length > 1 && allFeatures.length > 0 && (
        <section className="mt-16" aria-labelledby="compare-title">
          <SectionHeader id="compare-title" eyebrow="Compare" title="Compare plans side by side" />
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <caption className="sr-only">Premium plan comparison</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-2/5 px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">
                    Plan
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className={`px-4 py-4 text-center font-display text-base font-bold text-ink ${p.is_popular ? "bg-primary-50" : ""}`}
                    >
                      {p.name}
                      {p.is_popular && (
                        <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-wide text-primary">Recommended</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <th scope="row" className="px-5 py-3.5 text-left font-medium text-ink-muted">
                    Monthly
                  </th>
                  {plans.map((p) => (
                    <td key={p.id} className={`px-4 py-3.5 text-center font-semibold text-ink ${p.is_popular ? "bg-primary-50" : ""}`}>
                      {formatINR(p.monthly_price)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-3.5 text-left font-medium text-ink-muted">
                    Yearly
                  </th>
                  {plans.map((p) => (
                    <td key={p.id} className={`px-4 py-3.5 text-center text-ink ${p.is_popular ? "bg-primary-50" : ""}`}>
                      {formatINR(p.yearly_price)}
                      {p.yearly_discount_percent > 0 && (
                        <span className="ml-1 text-xs font-semibold text-success">−{p.yearly_discount_percent}%</span>
                      )}
                    </td>
                  ))}
                </tr>
                {allFeatures.map((f) => (
                  <tr key={f}>
                    <th scope="row" className="px-5 py-3.5 text-left font-medium text-ink">
                      {f}
                    </th>
                    {plans.map((p) => {
                      const has = (p.features ?? []).includes(f);
                      return (
                        <td key={p.id} className={`px-4 py-3.5 text-center ${p.is_popular ? "bg-primary-50" : ""}`}>
                          {has ? (
                            <Check className="mx-auto h-5 w-5 text-success" strokeWidth={2.5} aria-label="Included" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-ink-faint" aria-label="Not listed" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mt-16" aria-labelledby="premium-faq-title">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-start lg:gap-14">
          <SectionHeader id="premium-faq-title" eyebrow="FAQ" title="Questions about Premium" description="Anything else? Our support team is a message away." />
          <div className="card divide-y divide-line px-5 sm:px-6">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface text-ink-muted transition-transform group-open:rotate-45 motion-reduce:transform-none">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </summary>
                <p className="mt-2 pr-10 text-sm leading-relaxed text-ink-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {plans.length > 0 && (
        <section className="mt-16 rounded-3xl bg-gradient-to-br from-primary via-primary to-accent-violet px-6 py-10 text-center text-white sm:py-12">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Ready to go further?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/80">Pick a plan above — you can choose monthly or yearly billing.</p>
          <a
            href="#plans"
            className="theme-light mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-primary-700 shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
          >
            {recommended ? `Get ${recommended.name}` : "View plans"}
            <Sparkles className="h-4 w-4" aria-hidden />
          </a>
        </section>
      )}
    </div>
  );
}

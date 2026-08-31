import { getPublicSupabase } from "@/lib/supabase/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR } from "@/lib/format";
import PremiumSubscribeButton from "@/components/PremiumSubscribeButton";

export const revalidate = 300;
export const metadata = { title: "Premium" };

export default async function PremiumPage() {
  const supabase = getPublicSupabase();
  let plans: any[] = [];
  let features: any[] = [];
  if (supabase) {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("premium_plans").select("*").order("sort_order"),
      supabase.from("premium_features").select("*").order("sort_order"),
    ]);
    plans = p ?? [];
    features = f ?? [];
  }

  const authedSupabase = createAuthedServerSupabase();
  const { data: { user } } = await authedSupabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Premium</h1>
      <p className="mt-2 max-w-2xl text-slate">An optional tier on top of everything already free in CampusEduX — priority access, extra prep material, and faster support.</p>

      {features.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((f: any) => (
            <div key={f.id} className="border border-navy/10 bg-white p-4">
              <div className="font-serif text-navy">{f.title}</div>
              <p className="mt-1 text-sm text-slate">{f.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="empty-state mt-10">Plan pricing will appear here once published from the admin panel.</div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {plans.map((p: any) => (
            <div key={p.id} className={`border p-6 ${p.is_popular ? "border-marigold" : "border-navy/10"} bg-white`}>
              {p.is_popular && <div className="mb-2 text-xs font-semibold text-marigold">Most popular</div>}
              <div className="font-serif text-xl text-navy">{p.name}</div>
              <div className="mt-2 font-serif text-2xl text-navy">{formatINR(p.monthly_price)}<span className="text-sm text-slate">/mo</span></div>
              <div className="text-xs text-slate">or {formatINR(p.yearly_price)}/yr{p.yearly_discount_percent > 0 ? ` (save ${p.yearly_discount_percent}%)` : ""}</div>
              <ul className="mt-4 space-y-1 text-sm text-slate">
                {(p.features ?? []).map((feat: string) => <li key={feat}>• {feat}</li>)}
              </ul>
              <PremiumSubscribeButton planId={p.id} planName={p.name} isSignedIn={!!user} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { getPublicSupabase } from "@/lib/supabase/server";

export const revalidate = 300;
export const metadata = { title: "Referral Program" };

export default async function ReferralPage() {
  const supabase = getPublicSupabase();
  let settings: any = null;
  if (supabase) {
    const { data } = await supabase.from("reward_settings").select("*").eq("id", 1).maybeSingle();
    settings = data;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Referral Program</h1>
      <p className="mt-3 text-slate">
        Every CampusEduX student gets a referral code. When a friend joins through it, credit is added directly to your wallet — tracked on a running dashboard inside the app.
      </p>

      {settings ? (
        <div className="mt-8 border border-navy/10 bg-white p-5">
          <div className="font-serif text-navy">Current reward rule</div>
          <p className="mt-2 text-sm text-slate">
            {settings.bonus_type === "flat"
              ? `A flat reward of ₹${settings.bonus_value} per successful referral.`
              : `${settings.bonus_value}% of the referred student's first order (capped at ₹${settings.max_payout}).`}
            {" "}
            {settings.reward_on_signup
              ? "Reward is credited as soon as a referred friend signs up."
              : "Reward is credited after the referred friend's first purchase."}
          </p>
          <p className="mt-2 text-xs text-slate">Credit is valid for {settings.bonus_validity_days} days from being earned. This rule is set from the admin panel and can change — the app always shows the current value.</p>
        </div>
      ) : (
        <div className="empty-state mt-8">Current reward terms will appear here once connected to the live configuration.</div>
      )}

      <p className="mt-8 text-xs text-slate">Referral credit is added to your CampusEduX wallet and can be spent on projects, Premium, or withdrawn per the wallet&apos;s rules.</p>
    </div>
  );
}

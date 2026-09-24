import Link from "next/link";
import { Clock, IndianRupee, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import { Badge, EmptyState, ProgressBar } from "@/components/ui";
import { SITE_URL } from "@/lib/seo";
import { ReferralHero } from "@/components/referral/ReferralHero";
import { ReferralHowItWorks } from "@/components/referral/ReferralHowItWorks";
import { ShareReferralLink } from "@/components/referral/ShareReferralLink";

const isDone = (status: string) => status === "successful" || status === "completed";

export default async function AccountReferralPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: code }, { data: referrals }] = await Promise.all([
    supabase.from("referral_codes").select("code,total_referrals,total_earned").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("referrals")
      .select("id,status,reward_amount,created_at,completed_at,referred_user:profiles!referrals_referred_user_id_fkey(full_name,email)")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const link = code?.code ? `${SITE_URL}/register?ref=${code.code}` : null;
  const history = referrals ?? [];
  const completed = history.filter((r) => isDone(r.status)).length;
  const pending = history.length - completed;

  const STATS = [
    { label: "Friends referred", value: String(code?.total_referrals ?? 0), icon: Users, tone: "bg-primary-50 text-primary" },
    { label: "Total earned", value: formatINR(code?.total_earned ?? 0), icon: IndianRupee, tone: "bg-success/15 text-success" },
    { label: "Pending", value: String(pending), icon: Clock, tone: "bg-warning/15 text-amber-700 dark:text-amber-300" },
  ];

  return (
    <div className="space-y-8">
      <ReferralHero title="Refer & earn" subtitle="Share your link — when friends join CampusEduX through it, credit is added to your wallet.">
        {link && (
          <div className="theme-light mt-7 max-w-2xl rounded-2xl bg-white p-3 text-ink shadow-card sm:p-4">
            <ShareReferralLink link={link} code={code?.code} />
          </div>
        )}
      </ReferralHero>

      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card flex items-center gap-4 p-5">
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <div className="text-xs font-medium text-ink-faint">{s.label}</div>
                <div className="font-display text-2xl font-bold text-ink">{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-lg font-bold text-ink">Your referral progress</p>
            <p className="text-sm text-ink-muted">
              {completed} of {history.length} referral{history.length === 1 ? "" : "s"} rewarded
            </p>
          </div>
          <ProgressBar className="mt-3" value={completed} max={history.length} label="Referrals rewarded" size="md" tone="success" />
          {pending > 0 && (
            <p className="mt-2 text-xs text-ink-faint">
              {pending} pending — credit is added once each one qualifies under the{" "}
              <Link href="/referral" className="font-semibold text-primary hover:text-primary-700">
                current reward rule
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <ReferralHowItWorks />

      <section aria-labelledby="referral-history-title">
        <h2 id="referral-history-title" className="h-section">
          History
        </h2>
        {history.length === 0 ? (
          <EmptyState className="mt-4" title="No referrals yet" subtitle="Share your link above to start earning." />
        ) : (
          <div className="card mt-4 divide-y divide-line">
            {history.map((r) => {
              const ref = Array.isArray(r.referred_user) ? r.referred_user[0] : r.referred_user;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{ref?.full_name || ref?.email || "Pending signup"}</div>
                    <div className="text-xs text-ink-faint">{timeAgo(r.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ink">{formatINR(r.reward_amount)}</span>
                    <Badge tone={isDone(r.status) ? "success" : "neutral"}>{r.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

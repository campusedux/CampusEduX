import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui";
import CopyLinkButton from "./CopyLinkButton";

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusedux.app";
  const link = code?.code ? `${siteUrl}/register?ref=${code.code}` : null;

  const STATS = [
    { label: "Your code", value: code?.code ?? "—" },
    { label: "Friends referred", value: code?.total_referrals ?? 0 },
    { label: "Total earned", value: formatINR(code?.total_earned ?? 0) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Referral</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="text-xs text-ink-faint">{s.label}</div>
            <div className="mt-1 text-xl font-bold text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      {link && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <code className="flex-1 truncate text-sm text-ink-muted">{link}</code>
          <CopyLinkButton link={link} />
        </div>
      )}

      <h2 className="mt-10 text-lg font-bold text-ink">History</h2>
      {!referrals || referrals.length === 0 ? (
        <EmptyState className="mt-3" title="No referrals yet" subtitle="Share your link above to start earning." />
      ) : (
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {referrals.map((r) => {
            const ref = Array.isArray(r.referred_user) ? r.referred_user[0] : r.referred_user;
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-ink">{ref?.full_name || ref?.email || "Pending signup"}</div>
                  <div className="text-xs text-ink-faint">{timeAgo(r.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{formatINR(r.reward_amount)}</span>
                  <Badge tone={r.status === "successful" || r.status === "completed" ? "success" : "neutral"}>{r.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

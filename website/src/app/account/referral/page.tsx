import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import CopyLinkButton from "./CopyLinkButton";

export default async function AccountReferralPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: code }, { data: referrals }] = await Promise.all([
    supabase.from("referral_codes").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("referrals")
      .select("id,status,reward_amount,created_at,completed_at,referred_user:profiles!referrals_referred_user_id_fkey(full_name,email)")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://campusedux.app";
  const link = code?.code ? `${siteUrl}/register?ref=${code.code}` : null;

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Referral</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-navy/10 bg-white p-5">
          <div className="text-xs text-slate">Your code</div>
          <div className="mt-1 font-serif text-xl text-navy">{code?.code ?? "—"}</div>
        </div>
        <div className="border border-navy/10 bg-white p-5">
          <div className="text-xs text-slate">Friends referred</div>
          <div className="mt-1 font-serif text-xl text-navy">{code?.total_referrals ?? 0}</div>
        </div>
        <div className="border border-navy/10 bg-white p-5">
          <div className="text-xs text-slate">Total earned</div>
          <div className="mt-1 font-serif text-xl text-navy">{formatINR(code?.total_earned ?? 0)}</div>
        </div>
      </div>

      {link && (
        <div className="mt-6 flex items-center gap-3 border border-navy/10 bg-white p-4">
          <code className="flex-1 truncate text-sm text-slate">{link}</code>
          <CopyLinkButton link={link} />
        </div>
      )}

      <h2 className="mt-10 font-serif text-lg text-navy">History</h2>
      {(!referrals || referrals.length === 0) ? (
        <div className="empty-state mt-3">No referrals yet — share your link above.</div>
      ) : (
        <div className="mt-3 divide-y divide-navy/10 border-t border-navy/10">
          {referrals.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="text-navy">{r.referred_user?.full_name || r.referred_user?.email || "Pending signup"}</div>
                <div className="text-xs text-slate">{timeAgo(r.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-navy">{formatINR(r.reward_amount)}</div>
                <div className="text-xs text-slate">{r.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

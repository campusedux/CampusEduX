import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR } from "@/lib/format";

export default async function AccountOverviewPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: txns }, { count: purchaseCount }, { count: applicationCount }, { data: referralCode }] = await Promise.all([
    supabase.from("wallet_transactions").select("type,amount").eq("user_id", user.id),
    supabase.from("purchases").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "success"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("referral_codes").select("total_referrals").eq("user_id", user.id).maybeSingle(),
  ]);

  const balance = (txns ?? []).reduce((sum, t) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);

  const CARDS = [
    { href: "/account/wallet", label: "Wallet balance", value: formatINR(balance) },
    { href: "/account/purchases", label: "Projects purchased", value: purchaseCount ?? 0 },
    { href: "/account/applications", label: "Job applications", value: applicationCount ?? 0 },
    { href: "/account/referral", label: "Friends referred", value: referralCode?.total_referrals ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="border border-navy/10 bg-white p-5 hover:border-navy/30">
            <div className="text-xs text-slate">{c.label}</div>
            <div className="mt-2 font-serif text-2xl text-navy">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/custom-projects/my-projects" className="rounded-sm border border-navy/20 px-4 py-2 text-navy hover:border-navy/40">
          Custom project requests →
        </Link>
        <Link href="/account/saved-jobs" className="rounded-sm border border-navy/20 px-4 py-2 text-navy hover:border-navy/40">
          Saved jobs →
        </Link>
      </div>
    </div>
  );
}

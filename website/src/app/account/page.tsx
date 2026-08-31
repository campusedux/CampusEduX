import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui";

export default async function AccountOverviewPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: txns }, { count: purchaseCount }, { count: applicationCount }, { count: savedProjects }, { data: referralCode }] =
    await Promise.all([
      supabase.from("wallet_transactions").select("type,amount").eq("user_id", user.id),
      supabase.from("purchases").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "success"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("wishlists").select("project_id", { count: "exact", head: true }).eq("user_id", user.id),
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
      <h1 className="text-2xl font-bold text-ink">
        Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            <div className="text-xs text-ink-faint">{c.label}</div>
            <div className="mt-2 text-2xl font-bold text-ink">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Button href="/account/saved-projects" variant="ghost" size="sm">
          Saved projects{savedProjects ? ` (${savedProjects})` : ""}
        </Button>
        <Button href="/account/saved-jobs" variant="ghost" size="sm">
          Saved jobs
        </Button>
        <Button href="/custom-projects/my-projects" variant="ghost" size="sm">
          Custom project requests
        </Button>
      </div>
    </div>
  );
}

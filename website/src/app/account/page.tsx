import Link from "next/link";
import { ArrowRight, Wallet, ShoppingBag, Briefcase, Users, Bookmark, Heart, Wrench } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR } from "@/lib/format";

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
    { href: "/account/wallet", label: "Wallet balance", value: formatINR(balance), hint: "Lifetime balance", icon: Wallet },
    { href: "/account/purchases", label: "Projects purchased", value: purchaseCount ?? 0, hint: "Completed", icon: ShoppingBag },
    { href: "/account/applications", label: "Job applications", value: applicationCount ?? 0, hint: "Submitted", icon: Briefcase },
    { href: "/account/referral", label: "Friends referred", value: referralCode?.total_referrals ?? 0, hint: "Joined with your code", icon: Users },
  ];

  const SHORTCUTS = [
    { href: "/account/saved-projects", label: `Saved projects${savedProjects ? ` (${savedProjects})` : ""}`, icon: Bookmark },
    { href: "/account/saved-jobs", label: "Saved jobs", icon: Heart },
    { href: "/custom-projects/my-projects", label: "Custom project requests", icon: Wrench },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-ink-muted">Here&apos;s a snapshot of your CampusEduX account.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group card card-hover p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </span>
                <ArrowRight
                  className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                  aria-hidden
                />
              </div>
              <div className="mt-3 text-2xl font-bold text-ink">{c.value}</div>
              <div className="mt-1 text-sm font-medium text-ink">{c.label}</div>
              <div className="text-xs text-ink-faint">{c.hint}</div>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-faint">Shortcuts</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group card card-hover flex items-center gap-3 p-4"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface">
                <Icon className="h-[18px] w-[18px] text-ink-muted group-hover:text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{s.label}</span>
              <ArrowRight
                className="h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

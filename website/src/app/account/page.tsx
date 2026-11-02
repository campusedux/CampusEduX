import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Briefcase, Users, Bookmark, Heart, Wrench, Gift, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { getLearningGrids } from "@/lib/learning";
import { AccountLearningCard } from "@/components/account/AccountLearningCard";
import { AccountWalletSummary } from "@/components/account/AccountWalletSummary";
import { AccountWalletCard } from "@/components/account/AccountWalletCard";
import { PageHeader, SectionHeader, ListLoading } from "@/components/ui";

async function AccountContent() {
  const user = await requireUser();
  const supabase = await createAuthedServerSupabase();

  const [
    { count: purchaseCount },
    { count: applicationCount },
    { count: savedProjects },
    { data: referralCode },
    grids,
  ] = await Promise.all([
      supabase.from("purchases").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "success"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("wishlists").select("project_id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("referral_codes").select("total_referrals").eq("user_id", user.id).maybeSingle(),
      // Optional public enrichment: a catalog outage must not fail the account.
      getLearningGrids().catch(() => []),
    ]);

  const firstName = user.fullName ? user.fullName.split(" ")[0] : "";
  const STATS = [
    { href: "/account/purchases", label: "Projects purchased", value: purchaseCount ?? 0, icon: ShoppingBag, tone: "bg-primary-50 text-primary" },
    { href: "/account/applications", label: "Job applications", value: applicationCount ?? 0, icon: Briefcase, tone: "bg-accent-sky/15 text-accent-sky" },
    { href: "/account/saved-projects", label: "Saved projects", value: savedProjects ?? 0, icon: Bookmark, tone: "bg-accent-violet/15 text-accent-violet" },
    { href: "/account/referral", label: "Friends referred", value: referralCode?.total_referrals ?? 0, icon: Users, tone: "bg-accent-pink/15 text-accent-pink" },
  ];

  const SHORTCUTS = [
    { href: "/account/saved-jobs", label: "Saved jobs", icon: Heart },
    { href: "/account/resume", label: "My resumes", icon: FileText },
    { href: "/custom-projects/my-projects", label: "Custom project requests", icon: Wrench },
  ];

  return (
    <div className="account-overview min-w-0">
      <PageHeader title={`Welcome back${firstName ? `, ${firstName}` : ""}`} caption="Here's a snapshot of your CampusEduX account." />
      <div className="account-content list-enter min-w-0 [overflow-wrap:anywhere]">

      <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AccountLearningCard courses={grids.map(({ slug, name, topic_count }) => ({ slug, name, topic_count }))} />

        <div className="grid grid-cols-1 gap-4">
          <Suspense fallback={<AccountWalletCard balance={null} loading />}>
            <AccountWalletSummary userId={user.id} />
          </Suspense>
          <Link href="/account/referral" className="card card-hover group flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-pink/10">
              <Gift className="h-5 w-5 text-accent-pink" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink group-hover:text-primary">Refer &amp; earn</span>
              <span className="block text-sm text-ink-muted">
                {referralCode?.total_referrals
                  ? `${referralCode.total_referrals} friend${referralCode.total_referrals === 1 ? "" : "s"} joined with your link`
                  : "Share your link to earn wallet credit"}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-faint group-hover:text-primary" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="group card card-hover flex items-center gap-3 p-4">
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c.tone}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-2xl font-bold text-ink">{c.value}</span>
                <span className="block truncate text-sm text-ink-muted">{c.label}</span>
              </span>
            </Link>
          );
        })}
      </div>

      <SectionHeader title="Shortcuts" className="mt-5" />
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group card card-hover flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface">
                <Icon className="h-5 w-5 text-ink-muted group-hover:text-primary" aria-hidden />
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
    </div>
  );
}

// Keep streaming local to this index page: ancestor loading routes change nested 404 status.
export default function AccountPage() {
  return <Suspense fallback={<ListLoading title="Account" />}><AccountContent /></Suspense>;
}

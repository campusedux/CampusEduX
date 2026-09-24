import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSupabase } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { PageHeader } from "@/components/ui";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Custom Projects",
  alternates: { canonical: absoluteUrl("/custom-projects") },
};

const STEPS = [
  "Choose a project type and level",
  "Pick a platform (web, mobile, desktop)",
  "Select the features you need",
  "Upload any requirements or reference files",
  "Get an estimate",
  "Pay securely and submit",
  "Track progress and message the team",
  "Receive delivery and get support",
];

const TYPE_LABEL: Record<string, string> = {
  academic: "Academic",
  personal: "Personal",
  business: "Business",
};

export default async function CustomProjectsPage() {
  const supabase = getPublicSupabase();
  let typeStarting: { type: string; from: number; token: number }[] = [];
  let platforms: any[] = [];
  let features: any[] = [];

  if (supabase) {
    const [{ data: pricing }, { data: p }, { data: f }] = await Promise.all([
      // Base price + upfront token per (project_type, project_level) —
      // custom_project_pricing (mobile-app/supabase/migrations/0033).
      supabase.from("custom_project_pricing").select("project_type,project_level,base_price,token_amount").eq("is_active", true),
      // Platform is an add-on charge on top of the base price — 0 for web.
      supabase.from("custom_project_platform_pricing").select("platform,label,charge").eq("is_active", true).order("sort_order"),
      // Feature catalog — 0034_custom_feature_catalog.sql (category is free text).
      supabase.from("custom_project_features").select("id,name,category,price").eq("is_active", true).order("sort_order").limit(60),
    ]);

    const byType = new Map<string, { from: number; token: number }>();
    for (const row of pricing ?? []) {
      const base = Number(row.base_price);
      const current = byType.get(row.project_type);
      if (!current || base < current.from) {
        byType.set(row.project_type, { from: base, token: Number(row.token_amount) });
      }
    }
    typeStarting = ["academic", "personal", "business"]
      .filter((t) => byType.has(t))
      .map((t) => ({ type: t, ...byType.get(t)! }));

    platforms = p ?? [];
    features = f ?? [];
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="Custom Projects"
        description="Need something the marketplace doesn't have yet? Describe what you need, pay a small token to start, and the CampusEduX team builds and delivers it — tracked the same way as everything else in your account."
      />

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/custom-projects/start" className="btn-primary">
          Start a request
        </Link>
        <Link href="/custom-projects/my-projects" className="btn-ghost">
          My requests
        </Link>
      </div>

      <h2 className="mt-12 text-xl font-bold text-ink">How it works</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-card">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm text-ink-muted">{s}</span>
          </div>
        ))}
      </div>

      {typeStarting.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold text-ink">Starting price by project type</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {typeStarting.map((t) => (
              <div
                key={t.type}
                className="rounded-2xl border border-line bg-card p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg motion-reduce:transform-none"
              >
                <div className="font-semibold text-ink">{TYPE_LABEL[t.type] ?? t.type}</div>
                <div className="mt-1 text-lg font-bold text-ink">from {formatINR(t.from)}</div>
                <div className="mt-1 text-xs text-ink-faint">{formatINR(t.token)} token to begin</div>
              </div>
            ))}
          </div>
        </>
      )}

      {platforms.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold text-ink">Platform options</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {platforms.map((p: { platform: string; label: string; charge: number }) => (
              <div
                key={p.platform}
                className="rounded-2xl border border-line bg-card p-5 text-center shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-lg motion-reduce:transform-none"
              >
                <div className="text-sm text-ink-muted">{p.label}</div>
                <div className="mt-1 font-semibold text-ink">{Number(p.charge) > 0 ? `+${formatINR(p.charge)}` : "Included"}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {features.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold text-ink">Add-on features</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((f: { id: string; name: string; price: number }) => (
              <span key={f.id} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-ink">
                {f.name}
                {Number(f.price) > 0 ? ` — +${formatINR(f.price)}` : ""}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="mt-12 text-xs text-ink-faint">
        Final pricing is calculated and shown before payment — never assume the amount here is final without confirming
        it in the estimate step.
      </p>
    </div>
  );
}

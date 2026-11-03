import type { Metadata } from "next";
import Link from "next/link";
import { getPublicSupabase } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { loadProjectPricing } from "@/lib/customProjectPricing.server";
import { projectTokenPrices } from "@/lib/projectPricingText";
import { CustomProjectReadError, readCustomProject } from "@/lib/customProjectReads";

// Pricing deliberately bypasses the fetch cache; load the live catalog at request
// time rather than making deployment depend on Supabase availability.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Project Mentoring and Custom Software",
  description:
    "Get guidance on student-authored projects or commission personal and business software. Explore scope, pricing and the request process.",
  alternates: { canonical: absoluteUrl("/custom-projects") },
};

const STEPS = [
  "Choose a project type and level",
  "Pick a platform (web, mobile, desktop)",
  "For mentoring, describe the guidance you need",
  "Upload any requirements or reference files",
  "Get an estimate",
  "Pay securely and submit",
  "Track progress and message the team",
  "Receive mentoring feedback or software delivery",
];

const TYPE_LABEL: Record<string, string> = {
  academic: "Mentoring",
  personal: "Personal",
  business: "Business",
};

export default async function CustomProjectsPage() {
  const supabase = getPublicSupabase();
  if (!supabase) throw new CustomProjectReadError("unavailable");
  let typeStarting: { type: string; from: number; token: number }[] = [];
  let platforms: any[] = [];
  let features: any[] = [];
  let tokenPrices = projectTokenPrices([]);

  if (supabase) {
    const [pricing, p, f] = await Promise.all([
      // Base price + upfront token per (project_type, project_level) —
      // custom_project_pricing (mobile-app/supabase/migrations/0033).
      loadProjectPricing(),
      // Platform is an add-on charge on top of the base price — 0 for web.
      readCustomProject((signal) => supabase.from("custom_project_platform_pricing").select("platform,label,charge").eq("is_active", true).order("sort_order").abortSignal(signal)),
      // Feature catalog — 0034_custom_feature_catalog.sql (category is free text).
      readCustomProject((signal) => supabase
        .from("custom_project_features")
        .select("id,name,category,price,project_types")
        .eq("is_active", true)
        .order("sort_order").abortSignal(signal)),
    ]);

    // A successful empty catalog is valid; a missing response is a read failure.
    if (!Array.isArray(p) || !Array.isArray(f)) throw new CustomProjectReadError("unavailable");
    tokenPrices = projectTokenPrices(pricing);
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
    const assessedDeliverableIds = new Set([
      "doc-srs",
      "doc-project-report",
      "doc-ppt",
      "doc-viva",
      "doc-academic-package",
    ]);
    features = (f ?? []).filter(
      (item) =>
        !assessedDeliverableIds.has(item.id) &&
        (item.project_types?.includes("personal") ||
          item.project_types?.includes("business")),
    );
  }

  return (
    <div className="page-shell">
      <JsonLd data={breadcrumbJsonLd([{ name: "Custom Projects", path: "/custom-projects" }])} />
      <section className="relative overflow-hidden rounded-xl bg-[#0F0B2E] px-5 py-8 text-white shadow-card md:px-8 md:py-10">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-72 w-80 rounded-full bg-accent-pink/30 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C9C2FF]">Custom projects</p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            Need project help? <span className="text-[#B7ADFF]">Get mentoring or commission software.</span>
          </h1>
          <p className="mt-2 text-sm leading-5 text-white/75">
            Students can request code review, debugging, architecture guidance
            and feedback on their own work. Personal and business customers can
            commission complete software. Assessed work remains
            student-authored.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/custom-projects/start"
              className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-[#2A1FA8] transition hover:-translate-y-px motion-reduce:transform-none"
            >
              Start a request
            </Link>
            <Link
              href="/custom-projects/my-projects"
              className="inline-flex h-10 items-center rounded-xl border border-white/25 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              My requests
            </Link>
          </div>
        </div>
      </section>

      <h2 className="h-section mt-10 md:mt-14">How it works</h2>
      <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s} className="card flex min-w-0 items-start gap-3 p-4">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent-violet text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-1.5 text-sm leading-relaxed text-ink-muted">{s}</span>
          </li>
        ))}
      </ol>

      {typeStarting.length > 0 && (
        <>
          <h2 className="h-section mt-10 md:mt-14">Starting price by project type</h2>
          <p className="mt-2 text-sm text-ink-muted">Prices depend on the selected type and level. Current upfront tokens: {tokenPrices}. The estimate shows your selection before payment.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {typeStarting.map((t) => (
              <div
                key={t.type}
                className="card card-hover p-4 md:p-5"
              >
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{TYPE_LABEL[t.type] ?? t.type}</div>
                <div className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
                  <span className="text-base font-medium text-ink-muted">from </span>
                  {formatINR(t.from)}
                </div>
                <div className="mt-1 text-xs text-ink-faint">{formatINR(t.token)} token to begin</div>
              </div>
            ))}
          </div>
        </>
      )}

      {platforms.length > 0 && (
        <>
          <h2 className="h-section mt-10 md:mt-14">Platform options</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Platform charges apply to personal and business software. Mentoring
            has no platform charge.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {platforms.map((p: { platform: string; label: string; charge: number }) => (
              <div
                key={p.platform}
                className="card p-4 text-center md:p-5"
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
          <h2 className="h-section mt-10 md:mt-14">Add-on features</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((f: { id: string; name: string; price: number }) => (
              <span key={f.id} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-ink">
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

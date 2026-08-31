import Link from "next/link";
import { getPublicSupabase } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export const revalidate = 300;
export const metadata = { title: "Custom Projects" };

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
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Custom Projects</h1>
      <p className="mt-3 max-w-2xl text-slate">
        Need something that doesn&apos;t exist in the marketplace yet? Describe what you need, pay a small token to start, and the CampusEduX team builds and delivers it — tracked the same way as everything else in your account.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/custom-projects/start" className="rounded-sm bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy/90">
          Start a request
        </Link>
        <Link
          href="/custom-projects/my-projects"
          className="rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper"
        >
          My requests
        </Link>
      </div>

      <h2 className="mt-10 font-serif text-xl text-navy">How it works</h2>
      <ol className="mt-4 space-y-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex gap-3 text-slate">
            <span className="font-serif text-navy">{String(i + 1).padStart(2, "0")}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      {typeStarting.length > 0 && (
        <>
          <h2 className="mt-10 font-serif text-xl text-navy">Starting price by project type</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {typeStarting.map((t) => (
              <div key={t.type} className="border border-navy/10 bg-white p-4">
                <div className="font-serif text-navy">{TYPE_LABEL[t.type] ?? t.type}</div>
                <div className="mt-1 text-sm text-slate">from {formatINR(t.from)}</div>
                <div className="mt-1 text-xs text-slate">{formatINR(t.token)} token to begin</div>
              </div>
            ))}
          </div>
        </>
      )}

      {platforms.length > 0 && (
        <>
          <h2 className="mt-10 font-serif text-xl text-navy">Platform options</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {platforms.map((p: any) => (
              <div key={p.platform} className="border border-navy/10 bg-white p-4 text-center">
                <div className="text-sm text-slate">{p.label}</div>
                <div className="mt-1 font-serif text-navy">{Number(p.charge) > 0 ? `+${formatINR(p.charge)}` : "Included"}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {features.length > 0 && (
        <>
          <h2 className="mt-10 font-serif text-xl text-navy">Add-on features</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((f: any) => (
              <span key={f.id} className="rounded-sm border border-navy/10 bg-paper px-3 py-1.5 text-xs text-navy">
                {f.name}{Number(f.price) > 0 ? ` — +${formatINR(f.price)}` : ""}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="mt-10 text-xs text-slate">Final pricing is calculated and shown inside the app before payment — never assume the amount here is final without confirming it there.</p>
    </div>
  );
}

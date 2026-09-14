import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatINR, timeAgo } from "@/lib/format";
import { Badge, Button } from "@/components/ui";
import {
  PLATFORM_LABELS,
  TYPE_LABELS,
  LEVEL_LABELS,
  groupByCategory,
  type Platform,
  type ProjectLevel,
  type ProjectType,
} from "@/lib/customProjects";
import { loadDraftWithEstimate } from "@/lib/customProjects.server";
import StepBar from "../_builder/StepBar";
import { BottomBar } from "../_builder/BottomBar";
import { ConfigSummary } from "../_builder/ConfigSummary";

export const metadata: Metadata = {
  title: "Project estimate",
  robots: { index: false, follow: false },
};

const RECEIVE: string[] = [
  "Completed project implementation",
  "Selected features configured",
  "Project requirements considered",
  "Direct messaging with the team during development",
  "Project handover",
];

const BEFORE_YOU_CONTINUE: string[] = [
  "Your estimate is based on the project configuration selected above.",
  "Optional feature prices are shown separately from the base project price.",
  "Your project scope is based on the requirements and features you selected.",
  "The amount is calculated using the current CampusEduX pricing configuration.",
];

export default async function Page() {
  const user = await requireUser();
  const { draft, draftUpdatedAt, estimate } = await loadDraftWithEstimate(user.id);

  const missing: string[] = [];
  if (!draft.projectType) missing.push("project type");
  if (!draft.projectLevel) missing.push("level");
  if (!draft.platform) missing.push("platform");
  if (!draft.title.trim()) missing.push("title");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <StepBar current={2} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Step 3 · Project estimate</p>
          <h1 className="mt-2 text-[1.6rem] font-bold tracking-tight text-ink sm:text-3xl">Review your project estimate</h1>
          <p className="mt-2 text-sm text-ink-muted sm:text-[15px]">
            Here&apos;s a clear breakdown of what your project includes, what you&apos;ve added, and the amount
            required to start.
          </p>
        </div>
        {draftUpdatedAt && (
          <div className="flex-shrink-0 rounded-xl border border-line bg-white px-4 py-2.5 text-xs text-ink-muted shadow-card">
            Draft last saved <span className="font-semibold text-ink">{timeAgo(draftUpdatedAt)}</span>
          </div>
        )}
      </div>

      <div className="mt-8">
        {missing.length > 0 ? (
          <div className="empty-state">
            Still need: {missing.join(", ")}.{" "}
            <Link href="/custom-projects/start" className="text-ink underline">
              Go back and finish the details
            </Link>
            .
          </div>
        ) : (
          <EstimateBody draft={draft} estimate={estimate} />
        )}
      </div>
    </div>
  );
}

function EstimateBody({
  draft,
  estimate,
}: {
  draft: Awaited<ReturnType<typeof loadDraftWithEstimate>>["draft"];
  estimate: Awaited<ReturnType<typeof loadDraftWithEstimate>>["estimate"];
}) {
  const included = estimate.selectedFeatures.filter((f) => f.price === 0 || draft.aiRecommendedFeatureIds.includes(f.id));
  const additional = estimate.selectedFeatures.filter((f) => f.price > 0 && !draft.aiRecommendedFeatureIds.includes(f.id));
  const groupedIncluded = groupByCategory(included);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="min-w-0 space-y-8">
        {/* Project overview — same summary card as Features & Payment, so the
            customer visually recognizes it's the same project throughout. */}
        <ConfigSummary
          eyebrow="Project overview"
          projectType={draft.projectType as ProjectType}
          projectLevel={draft.projectLevel as ProjectLevel}
          platform={draft.platform as Platform}
          title={draft.title}
          overview={draft.aiOverview || draft.objective}
        />

        {/* Included Features */}
        <section>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
            <h2 className="text-lg font-bold text-ink">Included Features</h2>
          </div>
          {groupedIncluded.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">No included features are configured for this tier yet.</p>
          ) : (
            <div className="mt-4 space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card">
              {groupedIncluded.map(([category, rows]) => (
                <div key={category}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{category}</p>
                  <ul className="mt-1.5 space-y-1">
                    {rows.map((f) => (
                      <li key={f.id} className="flex items-center gap-2 text-sm text-ink">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden />
                        {f.name}
                        {f.price > 0 && <Badge tone="primary">+{formatINR(f.price)}</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Extra Features */}
        <section>
          <h2 className="text-lg font-bold text-ink">Extra Features</h2>
          <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-card">
            {additional.length === 0 ? (
              <p className="text-sm text-ink-faint">No extra features selected.</p>
            ) : (
              <ul className="space-y-2.5">
                {additional.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink">{f.name}</span>
                    <span className="font-semibold text-ink">+{formatINR(f.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* What you'll receive */}
        <section>
          <h2 className="text-lg font-bold text-ink">What you&apos;ll receive</h2>
          <ul className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-5 shadow-card">
            {RECEIVE.map((r) => (
              <li key={r} className="flex items-center gap-2.5 text-sm text-ink">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Right column */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-base font-bold text-ink">Estimate summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="Base project" value={formatINR(estimate.basePrice)} />
            <Row label="Platform charge" value={estimate.platformCharge > 0 ? formatINR(estimate.platformCharge) : "Included"} />
            <Row
              label="Included features"
              value={included.some((f) => f.price > 0) ? formatINR(included.reduce((s, f) => s + f.price, 0)) : "Included"}
            />
            <Row label="Extra features" value={formatINR(additional.reduce((s, f) => s + f.price, 0))} />
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm font-semibold text-ink">Estimated project price</span>
            <span className="text-lg font-bold text-ink">{formatINR(estimate.estimatedTotal)}</span>
          </div>

          <div className="mt-4 rounded-xl bg-primary-50/70 p-4">
            <p className="text-xs font-semibold text-primary">Amount to pay now</p>
            <p className="mt-1 text-3xl font-bold text-ink">{formatINR(estimate.tokenAmount)}</p>
            <p className="mt-1 text-xs text-ink-muted">
              A token to begin — the rest of the estimate is handled with the team as the project is delivered.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-ink">Before you continue</p>
          <ul className="mt-2 space-y-2">
            {BEFORE_YOU_CONTINUE.map((b) => (
              <li key={b} className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-white p-4 shadow-card">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">Secure estimate calculation</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              This amount is calculated from your project configuration on our server — never from a number sent by
              your browser.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-ink">Your selected scope</p>
          <dl className="mt-2.5 space-y-1.5 text-xs">
            <Row
              label="Configuration"
              value={`${TYPE_LABELS[draft.projectType as ProjectType]} · ${LEVEL_LABELS[draft.projectLevel as ProjectLevel]} · ${PLATFORM_LABELS[draft.platform as Platform]}`}
            />
            <Row label="Included features" value={String(included.length)} />
            <Row label="Extra features" value={String(additional.length)} />
            <Row label="Files uploaded" value={String(draft.referenceFiles.length + (draft.projectImagePath ? 1 : 0))} />
          </dl>
        </div>
      </aside>

      <div className="lg:col-span-2">
        <BottomBar
          step={3}
          sticky={false}
          left={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href="/custom-projects/features" className="text-sm font-medium text-ink-muted underline hover:text-ink">
                ← Edit features
              </Link>
              <Link href="/custom-projects/start" className="text-sm font-medium text-ink-muted underline hover:text-ink">
                ← Edit details
              </Link>
            </div>
          }
          right={
            <Button href="/custom-projects/checkout" leftIcon={Lock} size="lg">
              Continue to secure payment
            </Button>
          }
        />
        <p className="mt-3 text-xs text-ink-faint">
          You&apos;re reviewing your project scope before payment. Payment amount: {formatINR(estimate.tokenAmount)}.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

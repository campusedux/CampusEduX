import { CustomProjectReadError } from "@/lib/customProjectReads";
import { LoadError } from "../_builder/LoadError";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { type Platform, type ProjectLevel, type ProjectType } from "@/lib/customProjects";
import { loadDraftWithEstimate } from "@/lib/customProjects.server";
import FlowLayout from "../_builder/FlowLayout";
import { SelectionSummary } from "../_builder/SelectionSummary";
import CustomProjectCheckout from "./CustomProjectCheckout";

export const metadata: Metadata = {
  title: "Custom project payment",
  robots: { index: false, follow: false },
};

const TRUST_SIGNALS = [
  "Project details confirmed in the steps before this one",
  "Transparent estimate — the amount below matches what you reviewed",
  "Payments are processed by Razorpay and verified server-side; CampusEduX never sees your card or UPI details",
];

export default async function Page() {
  const user = await requireUser();
  let result: Awaited<ReturnType<typeof loadDraftWithEstimate>>;
  try {
    result = await loadDraftWithEstimate(user.id);
  } catch (error) {
    if (!(error instanceof CustomProjectReadError)) throw error;
    return <FlowLayout current={3}><LoadError kind={error.kind} /></FlowLayout>;
  }
  const { draft, estimate } = result;

  const included = estimate.selectedFeatures.filter((f) => f.isIncluded || f.price === 0 || draft.aiRecommendedFeatureIds.includes(f.id));
  const extra = estimate.selectedFeatures.filter((f) => !f.isIncluded && f.price > 0 && !draft.aiRecommendedFeatureIds.includes(f.id));

  return (
    <FlowLayout current={3}>
      <div className="mx-auto max-w-[720px]">

      <p className="eyebrow">Step 4 · Payment</p>
      <h1 className="mt-1 text-[25px] font-semibold leading-tight text-ink">Complete your project request</h1>
      <p className="mt-2 text-sm text-ink-muted sm:text-[15px]">
        Review your project details, then pay the token to submit your request.
      </p>

      <div className="mt-5">
        {!estimate.ready ? (
          <div className="empty-state">
            Your request isn&apos;t complete yet.{" "}
            <Link href="/custom-projects/start" className="text-ink underline">
              Go back to the start
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-4">
            {/* Same summary card as Features & Estimate, so this reads as the same project */}
            <SelectionSummary draft={draft} estimate={estimate} review />

            <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" aria-hidden />
                <p className="text-sm font-bold text-primary">Secure payment</p>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-primary/20 pb-4">
                <span className="text-sm text-ink-muted">Project estimate</span>
                <span className="text-sm font-semibold text-ink">{formatINR(estimate.estimatedTotal)}</span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-ink-muted">Token due now</p>
                <p className="mt-1 text-[28px] font-semibold text-ink">{formatINR(estimate.tokenAmount)}</p>
              </div>

              </div>
            </section>

              <div>
                <CustomProjectCheckout
                  draft={draft}
                  featureIds={estimate.selectedFeatures.map((f) => f.id)}
                  tokenAmount={estimate.tokenAmount}
                />
              </div>

            <ul className="space-y-2">
              {TRUST_SIGNALS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
              <p className="text-xs leading-relaxed text-ink-muted">
                Your request is only created and shown to our team after payment is verified.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href="/custom-projects/features" className="text-sm font-medium text-ink-muted underline hover:text-ink">
                ← Edit features
              </Link>
              <Link href="/custom-projects/estimate" className="text-sm font-medium text-ink-muted underline hover:text-ink">
                ← Back to estimate
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </FlowLayout>
  );
}

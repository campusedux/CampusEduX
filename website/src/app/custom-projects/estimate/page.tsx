import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { PLATFORM_LABELS, TYPE_LABELS, LEVEL_LABELS, type Platform, type ProjectLevel, type ProjectType } from "@/lib/customProjects";
import { loadDraftWithEstimate } from "@/lib/customProjects.server";
import StepBar from "../_builder/StepBar";

export const metadata: Metadata = {
  title: "Project estimate",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await requireUser();
  const { draft, estimate } = await loadDraftWithEstimate(user.id);

  const missing: string[] = [];
  if (!draft.projectType) missing.push("project type");
  if (!draft.projectLevel) missing.push("level");
  if (!draft.platform) missing.push("platform");
  if (!draft.title.trim()) missing.push("title");

  return (
    <div className="container-prose py-12">
      <h1 className="text-3xl font-bold text-ink">Estimate</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Calculated from the current CampusEduX pricing. The amount you pay now is a fixed token; the balance is handled later
        with the team.
      </p>

      <div className="mt-8">
        <StepBar current={2} />

        {missing.length > 0 ? (
          <div className="empty-state">
            Still need: {missing.join(", ")}.{" "}
            <Link href="/custom-projects/start" className="text-ink underline">
              Go back and finish the details
            </Link>
            .
          </div>
        ) : (
          <>
            <div className="border border-line bg-white p-5 text-sm">
              <dl className="space-y-1 text-ink-muted">
                <div className="flex justify-between">
                  <dt>Configuration</dt>
                  <dd className="text-ink">
                    {TYPE_LABELS[draft.projectType as ProjectType]} · {LEVEL_LABELS[draft.projectLevel as ProjectLevel]} ·{" "}
                    {PLATFORM_LABELS[draft.platform as Platform]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Base price</dt>
                  <dd className="text-ink">{formatINR(estimate.basePrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Platform charge</dt>
                  <dd className="text-ink">{estimate.platformCharge > 0 ? formatINR(estimate.platformCharge) : "Included"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Features ({estimate.selectedFeatures.length})</dt>
                  <dd className="text-ink">{formatINR(estimate.featureTotal)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
                  <dt className="text-ink">Estimated project price</dt>
                  <dd className="text-ink">{formatINR(estimate.estimatedTotal)}</dd>
                </div>
                <div className="flex justify-between text-ink">
                  <dt className="font-semibold">Token to pay now</dt>
                  <dd className="font-semibold">{formatINR(estimate.tokenAmount)}</dd>
                </div>
              </dl>
            </div>

            {estimate.selectedFeatures.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-ink">Selected features</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                  {estimate.selectedFeatures.map((f) => (
                    <li key={f.id} className="flex justify-between">
                      <span>{f.name}</span>
                      <span className="text-ink">{f.price > 0 ? formatINR(f.price) : "Included"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs text-ink-muted">
              This estimate is recomputed on the server when you pay, so catalog changes can&apos;t skew what you&apos;re charged.
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-6">
              <Link
                href="/custom-projects/features"
                className="text-sm font-medium text-ink-muted underline hover:text-ink"
              >
                Back
              </Link>
              <Link href="/custom-projects/checkout" className="btn-primary">
                Proceed to payment
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

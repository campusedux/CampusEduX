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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl text-navy">Estimate</h1>
      <p className="mt-2 text-sm text-slate">
        Calculated from the current CampusEduX pricing. The amount you pay now is a fixed token; the balance is handled later
        with the team.
      </p>

      <div className="mt-8">
        <StepBar current={2} />

        {missing.length > 0 ? (
          <div className="empty-state">
            Still need: {missing.join(", ")}.{" "}
            <Link href="/custom-projects/start" className="text-navy underline">
              Go back and finish the details
            </Link>
            .
          </div>
        ) : (
          <>
            <div className="border border-navy/10 bg-white p-5 text-sm">
              <dl className="space-y-1 text-slate">
                <div className="flex justify-between">
                  <dt>Configuration</dt>
                  <dd className="text-navy">
                    {TYPE_LABELS[draft.projectType as ProjectType]} · {LEVEL_LABELS[draft.projectLevel as ProjectLevel]} ·{" "}
                    {PLATFORM_LABELS[draft.platform as Platform]}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Base price</dt>
                  <dd className="text-navy">{formatINR(estimate.basePrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Platform charge</dt>
                  <dd className="text-navy">{estimate.platformCharge > 0 ? formatINR(estimate.platformCharge) : "Included"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Features ({estimate.selectedFeatures.length})</dt>
                  <dd className="text-navy">{formatINR(estimate.featureTotal)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-navy/10 pt-2 font-semibold">
                  <dt className="text-navy">Estimated project price</dt>
                  <dd className="text-navy">{formatINR(estimate.estimatedTotal)}</dd>
                </div>
                <div className="flex justify-between text-navy">
                  <dt className="font-semibold">Token to pay now</dt>
                  <dd className="font-semibold">{formatINR(estimate.tokenAmount)}</dd>
                </div>
              </dl>
            </div>

            {estimate.selectedFeatures.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-navy">Selected features</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate">
                  {estimate.selectedFeatures.map((f) => (
                    <li key={f.id} className="flex justify-between">
                      <span>{f.name}</span>
                      <span className="text-navy">{f.price > 0 ? formatINR(f.price) : "Included"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs text-slate">
              This estimate is recomputed on the server when you pay, so catalog changes can&apos;t skew what you&apos;re charged.
            </p>

            <div className="mt-6 flex items-center justify-between border-t border-navy/10 pt-6">
              <Link href="/custom-projects/features" className="text-sm text-navy underline">
                Back
              </Link>
              <Link
                href="/custom-projects/checkout"
                className="rounded-sm bg-navy px-6 py-2.5 text-sm text-paper hover:bg-navy/90"
              >
                Proceed to payment
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { loadDraftWithEstimate } from "@/lib/customProjects.server";
import StepBar from "../_builder/StepBar";
import CustomProjectCheckout from "./CustomProjectCheckout";

export const metadata: Metadata = {
  title: "Custom project payment",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await requireUser();
  const { draft, estimate } = await loadDraftWithEstimate(user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl text-navy">Payment</h1>
      <p className="mt-2 text-sm text-slate">
        Pay the token to submit your request. It&apos;s picked up by the CampusEduX team only after the payment is verified.
      </p>

      <div className="mt-8">
        <StepBar current={3} />

        {!estimate.ready ? (
          <div className="empty-state">
            Your request isn&apos;t complete yet.{" "}
            <Link href="/custom-projects/start" className="text-navy underline">
              Go back to the start
            </Link>
            .
          </div>
        ) : (
          <>
            <div className="border border-navy/10 bg-white p-5 text-sm">
              <div className="font-serif text-navy">{draft.title}</div>
              <dl className="mt-3 space-y-1 text-slate">
                <div className="flex justify-between">
                  <dt>Estimated project price</dt>
                  <dd className="text-navy">{formatINR(estimate.estimatedTotal)}</dd>
                </div>
                <div className="flex justify-between font-semibold text-navy">
                  <dt>Token due now</dt>
                  <dd>{formatINR(estimate.tokenAmount)}</dd>
                </div>
              </dl>
            </div>

            <CustomProjectCheckout draft={draft} tokenAmount={estimate.tokenAmount} />

            <p className="mt-4 text-xs text-slate">
              Payments are processed by Razorpay and verified server-side. CampusEduX never sees your card or UPI details.
            </p>
            <Link href="/custom-projects/estimate" className="mt-4 inline-block text-sm text-navy underline">
              Back to estimate
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

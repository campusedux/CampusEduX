"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";
import { formatINR } from "@/lib/format";
import type { BuilderDraft } from "@/lib/customProjects";

/**
 * Reuses the wallet / premium pattern exactly: the existing Edge Functions do
 * all the money work. create-custom-project-order recomputes every amount from
 * the DB (never trusts this payload's numbers — it only reads the config), and
 * verify-custom-project-payment does the real HMAC check before the request
 * becomes admin-visible. This component never computes or trusts a price.
 */
export default function CustomProjectCheckout({
  draft,
  tokenAmount,
}: {
  draft: BuilderDraft;
  tokenAmount: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setStatus("processing");
    setError(null);
    const supabase = createBrowserSupabase();

    try {
      const { data: order, error: orderError } = await supabase.functions.invoke("create-custom-project-order", {
        body: {
          projectType: draft.projectType,
          projectLevel: draft.projectLevel,
          platform: draft.platform,
          title: draft.title,
          objective: draft.objective,
          problemStatement: draft.problemStatement,
          description: draft.description,
          targetUsers: draft.targetUsers,
          technologyPreference: draft.technologyPreference,
          featureIds: draft.featureIds,
          customRequirements: draft.customRequirements,
          projectImagePath: draft.projectImagePath,
          referenceFiles: draft.referenceFiles,
        },
      });
      if (orderError) throw new Error(orderError.message);
      if (order?.error) throw new Error(order.error);

      const Razorpay = await loadRazorpayScript();
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "CampusEduX",
        description: `Custom project token — ${order.requestCode}`,
        handler: async (response: any) => {
          const verdict = interpretVerifyResponse(
            await supabase.functions.invoke("verify-custom-project-payment", {
              body: {
                requestId: order.requestId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            }),
          );
          if (!verdict.ok) {
            setStatus("error");
            setError(verdict.message);
            return;
          }
          // The request is real now — clear the draft and open it.
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) await supabase.from("custom_project_drafts").delete().eq("user_id", user.id);
          setStatus("idle");
          router.push(`/custom-projects/my-projects/${order.requestId}`);
          router.refresh();
        },
        modal: { ondismiss: () => setStatus("idle") },
        theme: { color: "#12213D" },
      });
      checkout.open();
    } catch (err: any) {
      setStatus("error");
      setError(err.message ?? "Something went wrong.");
    }
  }

  return (
    <div className="mt-5">
      <button
        onClick={handlePay}
        disabled={status === "processing"}
        className="rounded-sm bg-marigold px-6 py-2.5 text-sm font-semibold text-navy hover:bg-marigold-deep disabled:opacity-60"
      >
        {status === "processing" ? "Opening checkout…" : `Pay ${formatINR(tokenAmount)} token`}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

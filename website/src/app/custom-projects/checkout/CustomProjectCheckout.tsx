"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui";
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
  featureIds,
  tokenAmount,
}: {
  draft: BuilderDraft;
  featureIds: string[];
  tokenAmount: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "processing" | "error" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryVerification, setRetryVerification] = useState<(() => Promise<void>) | null>(null);

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
          featureIds,
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
        handler: async function verifyHandler(response: any) {
          setStatus("processing");
          setError(null);
          setRetryVerification(null);
          try {
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
            throw new Error(verdict.message);
          }
          // The request is real now — clear the draft and open it.
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) await supabase.from("custom_project_drafts").delete().eq("user_id", user.id);
          setRetryVerification(null);
          setStatus("idle");
          router.push(`/custom-projects/my-projects/${order.requestId}`);
          } catch (err) {
            setStatus("pending");
            setError("Payment received, verification pending. Check Purchases/Wallet, then retry verification.");
            setRetryVerification(() => () => verifyHandler(response));
          } finally {
            router.refresh();
          }
        },
        modal: { ondismiss: () => setStatus((current) => current === "pending" ? current : "idle") },
        theme: { color: "#4F39F6" },
      });
      checkout.open();
    } catch (err: any) {
      setStatus("error");
      setError(err.message ?? "Something went wrong.");
    }
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        fullWidth
        leftIcon={Lock}
        onClick={handlePay}
        disabled={status === "processing" || status === "pending"}
        loading={status === "processing"}
      >
        {status === "processing" ? "Opening checkout…" : `Pay ${formatINR(tokenAmount)} token`}
      </Button>
      {retryVerification && <button type="button" className="btn-secondary mt-2" onClick={retryVerification}>Retry verification</button>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

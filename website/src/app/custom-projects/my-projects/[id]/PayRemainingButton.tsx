"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";
import { formatINRExact } from "@/lib/format";
import { Button } from "@/components/ui";

/**
 * "Pay Remaining Amount" (Bug 3) — same pattern as CustomProjectCheckout: the
 * amount is never computed here. create-custom-project-balance-order
 * recomputes coalesce(final_price, estimated_total) - amount_paid from the DB,
 * and verify-custom-project-balance-payment does the real HMAC check before
 * the ledger row (and so amount_paid) is ever touched.
 */
export default function PayRemainingButton({ requestId, remaining }: { requestId: string; remaining: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "processing" | "error" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryVerification, setRetryVerification] = useState<(() => Promise<void>) | null>(null);

  async function handlePay() {
    setStatus("processing");
    setError(null);
    const supabase = createBrowserSupabase();

    try {
      const { data: order, error: orderError } = await supabase.functions.invoke("create-custom-project-balance-order", {
        body: { requestId },
      });
      if (orderError) throw new Error(orderError.message);
      if (order?.error) throw new Error(order.error);

      const Razorpay = await loadRazorpayScript();
      let verificationStarted = false;
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "CampusEduX",
        description: "Custom project — remaining balance",
        handler: async function verifyHandler(response: any) {
          verificationStarted = true;
          setStatus("processing");
          setError(null);
          setRetryVerification(null);
          try {
          const verdict = interpretVerifyResponse(
            await supabase.functions.invoke("verify-custom-project-balance-payment", {
              body: {
                paymentId: order.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            }),
          );
          if (!verdict.ok) {
            throw new Error(verdict.message);
          }
          setRetryVerification(null);
          setStatus("idle");
          } catch (err) {
            setStatus("pending");
            setError("Payment received, verification pending. Check Purchases/Wallet, then retry verification.");
            setRetryVerification(() => () => verifyHandler(response));
          } finally {
            router.refresh();
          }
        },
        modal: { ondismiss: () => { if (!verificationStarted) setStatus((current) => current === "pending" ? current : "idle"); } },
        theme: { color: "#4F39F6" },
      });
      checkout.on("payment.failed", (response: { error?: { description?: string } }) => {
        if (!verificationStarted) setError(response.error?.description ?? "Payment failed. Retry in checkout or close it to try again.");
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
        leftIcon={Lock}
        onClick={handlePay}
        disabled={status === "processing" || status === "pending"}
        loading={status === "processing"}
      >
        {status === "processing" ? "Opening checkout…" : `Pay remaining ${formatINRExact(remaining)}`}
      </Button>
      {retryVerification && <button type="button" className="btn-secondary mt-2" disabled={status === "processing"} onClick={retryVerification}>Retry verification</button>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

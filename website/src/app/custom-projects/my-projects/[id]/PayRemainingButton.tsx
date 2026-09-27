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
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "CampusEduX",
        description: "Custom project — remaining balance",
        handler: async (response: any) => {
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
            setStatus("error");
            setError(verdict.message);
            return;
          }
          setStatus("idle");
          router.refresh();
        },
        modal: { ondismiss: () => setStatus("idle") },
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
        leftIcon={Lock}
        onClick={handlePay}
        disabled={status === "processing"}
        loading={status === "processing"}
      >
        {status === "processing" ? "Opening checkout…" : `Pay remaining ${formatINRExact(remaining)}`}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

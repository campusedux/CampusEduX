"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";

export default function PremiumSubscribeButton({
  planId,
  planName,
  isSignedIn,
}: {
  planId: string;
  planName: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <Link href={`/login?next=/premium`} className="mt-4 block rounded-sm bg-navy py-2 text-center text-sm text-paper hover:bg-navy/90">
        Sign in to subscribe
      </Link>
    );
  }

  async function handleSubscribe() {
    setStatus("processing");
    setError(null);
    const supabase = createBrowserSupabase();

    try {
      const { data: order, error: orderError } = await supabase.functions.invoke("create-premium-order", {
        body: { planId, billingCycle },
      });
      if (orderError) throw new Error(orderError.message);
      if (order?.error) throw new Error(order.error);

      const Razorpay = await loadRazorpayScript();
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "CampusEduX Premium",
        description: `${order.planName} — ${order.billingCycle}`,
        handler: async (response: any) => {
          const verdict = interpretVerifyResponse(
            await supabase.functions.invoke("verify-premium-payment", {
              body: {
                orderId: order.orderId,
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
          router.push("/account");
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
    <div className="mt-4">
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`rounded-sm border px-2 py-1 ${billingCycle === "monthly" ? "border-navy bg-navy text-paper" : "border-navy/20 text-navy"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`rounded-sm border px-2 py-1 ${billingCycle === "yearly" ? "border-navy bg-navy text-paper" : "border-navy/20 text-navy"}`}
        >
          Yearly
        </button>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={status === "processing"}
        className="mt-3 w-full rounded-sm bg-navy py-2 text-sm text-paper hover:bg-navy/90 disabled:opacity-60"
      >
        {status === "processing" ? "Opening checkout…" : `Subscribe to ${planName}`}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

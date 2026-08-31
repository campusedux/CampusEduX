"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";
import { Button } from "@/components/ui";

export default function TopUpForm() {
  const router = useRouter();
  const [amount, setAmount] = useState(500);
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleTopUp() {
    setStatus("processing");
    setError(null);
    const supabase = createBrowserSupabase();

    try {
      // 1. Ask the existing create-wallet-topup-order Edge Function for a
      //    Razorpay order — it inserts the pending wallet_topup_orders row
      //    server-side and returns razorpayKeyId + amount in paise.
      const { data: order, error: orderError } = await supabase.functions.invoke("create-wallet-topup-order", {
        body: { amount },
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
        description: "Wallet top-up",
        handler: async (response: any) => {
          // 2. Hand the payment signature to the existing
          //    verify-wallet-topup-payment function — it does the real
          //    HMAC-SHA256 check server-side before crediting the wallet.
          const verdict = interpretVerifyResponse(
            await supabase.functions.invoke("verify-wallet-topup-payment", {
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
          router.refresh();
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
        theme: { color: "#4F39F6" },
      });

      checkout.open();
    } catch (err: any) {
      setStatus("error");
      setError(err.message ?? "Something went wrong.");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input
        type="number"
        min={10}
        max={100000}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-28 rounded-lg border border-line bg-white px-3 py-2 text-sm"
      />
      <Button onClick={handleTopUp} loading={status === "processing"}>
        {status === "processing" ? "Opening checkout…" : "Top up"}
      </Button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}

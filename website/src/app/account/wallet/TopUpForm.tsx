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
  const [status, setStatus] = useState<"idle" | "processing" | "error" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryVerification, setRetryVerification] = useState<(() => Promise<void>) | null>(null);

  async function handleTopUp() {
    if (!Number.isFinite(amount) || amount < 10 || amount > 100000) {
      setStatus("error");
      setError("Enter an amount between ₹10 and ₹1,00,000.");
      return;
    }
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
        handler: async function verifyHandler(response: any) {
          setStatus("processing");
          setError(null);
          setRetryVerification(null);
          try {
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
        modal: {
          ondismiss: () => setStatus((current) => current === "pending" ? current : "idle"),
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
        onChange={(e) => {
          // A cleared/invalid field parses to NaN — coerce to 0 so it never
          // reaches the Edge Function (which rejects anything under ₹10). The
          // min/max attributes still guide valid input while typing.
          const next = Number(e.target.value);
          setAmount(Number.isFinite(next) ? next : 0);
        }}
        className="h-11 w-28 rounded-xl border border-line bg-card px-3.5 text-sm"
      />
      <Button onClick={handleTopUp} disabled={status === "pending"} loading={status === "processing"}>
        {status === "processing" ? "Opening checkout…" : "Top up"}
      </Button>
      {retryVerification && <button type="button" className="btn-secondary mt-2" onClick={retryVerification}>Retry verification</button>}
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}

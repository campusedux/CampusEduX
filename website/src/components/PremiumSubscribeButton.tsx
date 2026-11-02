"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";

export default function PremiumSubscribeButton({
  planId,
  planName,
}: {
  planId: string;
  planName: string;
}) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [status, setStatus] = useState<"idle" | "processing" | "error" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryVerification, setRetryVerification] = useState<(() => Promise<void>) | null>(null);
  // Resolved client-side so /premium can stay statically cached (ISR) — the
  // page no longer reads the session on the server. Mirrors the same pattern
  // ProjectPurchasePanel uses on the ISR-cached /projects/[id] page.
  const [authState, setAuthState] = useState<"loading" | "anon" | "signed-in">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await createBrowserSupabase().auth.getUser();
      if (active) setAuthState(user ? "signed-in" : "anon");
    })();
    return () => {
      active = false;
    };
  }, []);

  if (authState === "loading") {
    return <div className="mt-4 h-11 w-full animate-pulse rounded-xl bg-line/70" aria-hidden />;
  }

  if (authState === "anon") {
    return (
      <Link href={`/login?next=/premium`} className="btn-primary mt-4 w-full">
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
      let verificationStarted = false;
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "CampusEduX Premium",
        description: `${order.planName} — ${order.billingCycle}`,
        handler: async function verifyHandler(response: any) {
          verificationStarted = true;
          setStatus("processing");
          setError(null);
          setRetryVerification(null);
          try {
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
            throw new Error(verdict.message);
          }
          setRetryVerification(null);
          setStatus("idle");
          router.push("/account");
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
    <div className="mt-4">
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`rounded-lg border px-3 py-1 font-medium ${billingCycle === "monthly" ? "border-primary bg-primary text-white" : "border-line text-ink-muted"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`rounded-lg border px-3 py-1 font-medium ${billingCycle === "yearly" ? "border-primary bg-primary text-white" : "border-line text-ink-muted"}`}
        >
          Yearly
        </button>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={status === "processing" || status === "pending"}
        className="btn-primary mt-3 w-full"
      >
        {status === "processing" ? "Opening checkout…" : `Subscribe to ${planName}`}
      </button>
      {retryVerification && <button type="button" className="btn-secondary mt-2" disabled={status === "processing"} onClick={retryVerification}>Retry verification</button>}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

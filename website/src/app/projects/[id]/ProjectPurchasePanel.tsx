"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loadRazorpayScript } from "@/lib/razorpay";
import { interpretVerifyResponse } from "@/lib/payments";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui";

type Phase = "loading" | "anon" | "owned" | "buy" | "processing" | "error" | "pending";

/**
 * Direct project purchase — reuses the existing `create-razorpay-order` /
 * `verify-razorpay-payment` Edge Functions (same server-side HMAC verification
 * as the mobile app). This component never computes or trusts a price: the
 * function recomputes price + platform fee from the DB and Razorpay shows the
 * authoritative amount. Protected files are never exposed here — a completed
 * purchase redirects to /account/purchases where downloads are ownership-gated.
 */
export default function ProjectPurchasePanel({
  projectId,
  price,
  title,
}: {
  projectId: string;
  price: number;
  title: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryVerification, setRetryVerification] = useState<(() => Promise<void>) | null>(null);

  const load = useCallback(async () => {
    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPhase("anon");
      return;
    }
    const { data: owned } = await supabase
      .from("purchases")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("status", "success")
      .maybeSingle();
    setPhase(owned ? "owned" : "buy");
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBuy() {
    setError(null);
    setPhase("processing");
    const supabase = createBrowserSupabase();
    try {
      const { data: order, error: orderError } = await supabase.functions.invoke("create-razorpay-order", {
        body: { projectId },
      });
      if (orderError) throw new Error(orderError.message);
      if (!order || order.error) throw new Error(order?.error || "Could not start checkout.");

      const Razorpay = await loadRazorpayScript();
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "CampusEduX",
        description: title,
        handler: async function verifyHandler(response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          setPhase("processing");
          setError(null);
          setRetryVerification(null);
          try {
          const verdict = interpretVerifyResponse(
            await supabase.functions.invoke("verify-razorpay-payment", {
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
          setPhase("owned");
          router.push("/account/purchases");
          } catch (err) {
            setPhase("pending");
            setError("Payment received, verification pending. Check Purchases/Wallet, then retry verification.");
            setRetryVerification(() => () => verifyHandler(response));
          } finally {
            router.refresh();
          }
        },
        modal: { ondismiss: () => setPhase((current) => current === "pending" ? current : "buy") },
        theme: { color: "#4F39F6" },
      });
      checkout.open();
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (phase === "loading") {
    return <div className="mt-5 h-11 w-full animate-pulse rounded-xl bg-line/70 sm:w-56" />;
  }

  if (phase === "anon") {
    return (
      <div className="mt-5">
        <Button href={`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`} fullWidth className="sm:w-auto">
          Sign in to buy
        </Button>
        <p className="mt-2 text-xs text-ink-faint">Same account as the CampusEduX app.</p>
      </div>
    );
  }

  if (phase === "owned") {
    return (
      <div className="mt-5">
        <Button href="/account/purchases" variant="secondary" fullWidth className="sm:w-auto">
          You own this — go to downloads
        </Button>
      </div>
    );
  }

  if (price <= 0) {
    return (
      <div className="mt-5">
        <Button href="/account/purchases" variant="secondary" fullWidth className="sm:w-auto">
          Free — open in your account
        </Button>
        <p className="mt-2 text-xs text-ink-faint">Free projects are added to your account for download.</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <Button onClick={handleBuy} disabled={phase === "pending"} loading={phase === "processing"} fullWidth className="sm:w-auto">
        {phase === "processing" ? "Opening checkout…" : `Buy now · ${formatINR(price)}`}
      </Button>
      <p className="mt-2 text-xs text-ink-faint">
        Secure payment via Razorpay. Source code &amp; docs unlock in your account after payment.
      </p>
      {retryVerification && <button type="button" className="btn-secondary mt-2" onClick={retryVerification}>Retry verification</button>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { formatINR } from "@/lib/format";
import { isValidUpiId } from "@/lib/wallet";
import { Button } from "@/components/ui";

/**
 * UPI withdrawal REQUEST (not an instant payout). The request_withdrawal RPC
 * (migration 0144) re-validates everything, holds the amount and queues it for
 * the admin team in one transaction — these checks are only for fast feedback.
 */
export default function WithdrawForm({
  balance,
  minPayout,
  hasPending,
}: {
  balance: number;
  minPayout: number;
  hasPending: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (hasPending) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        You have a pending withdrawal request. You can request another once it is processed.
      </p>
    );
  }

  async function handleWithdraw() {
    if (status === "processing") return;
    const value = Number(amount);
    let problem: string | null = null;
    if (!Number.isFinite(value) || value <= 0) problem = "Enter an amount to withdraw.";
    else if (Math.abs(Math.round(value * 100) - value * 100) > 1e-8) problem = "Amount can have at most 2 decimal places.";
    else if (value < minPayout) problem = `Minimum withdrawal amount is ${formatINR(minPayout)}.`;
    else if (value > balance) problem = "You can't withdraw more than your wallet balance.";
    else if (!isValidUpiId(upiId)) problem = "Enter a valid UPI ID (for example name@bank).";
    if (problem) {
      setStatus("error");
      setError(problem);
      return;
    }

    setStatus("processing");
    setError(null);
    try {
      const { error: rpcError } = await createBrowserSupabase().rpc("request_withdrawal", {
        p_amount: value,
        p_upi_id: upiId.trim(),
      });
      if (rpcError) {
        setStatus("error");
        setError(rpcError.message || "Couldn't submit your withdrawal request. Please try again.");
        return;
      }
      setStatus("done");
      setAmount("");
      setUpiId("");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't submit your withdrawal request. Please try again.");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <input
        type="number"
        inputMode="decimal"
        min={minPayout}
        max={balance}
        step="0.01"
        placeholder={`Amount (min ${formatINR(minPayout)})`}
        aria-label="Withdrawal amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-11 w-44 rounded-xl border border-line bg-card px-3.5 text-sm"
      />
      <input
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="UPI ID (e.g. name@bank)"
        aria-label="UPI ID"
        value={upiId}
        onChange={(e) => setUpiId(e.target.value)}
        className="h-11 w-56 rounded-xl border border-line bg-card px-3.5 text-sm"
      />
      <Button onClick={handleWithdraw} loading={status === "processing"} variant="secondary">
        {status === "processing" ? "Submitting…" : "Request withdrawal"}
      </Button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
      {status === "done" && (
        <p className="w-full text-sm text-success">
          Withdrawal requested. The amount is on hold and will be sent to your UPI ID after review (3-5 business days).
        </p>
      )}
    </div>
  );
}

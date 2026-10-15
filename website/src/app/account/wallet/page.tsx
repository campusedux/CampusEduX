import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import { WITHDRAWAL_STATUS_LABEL, type WithdrawalStatus } from "@/lib/wallet";
import { EmptyState } from "@/components/ui";
import TopUpForm from "./TopUpForm";
import WithdrawForm from "./WithdrawForm";
import { Receipt, Wallet } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";

export default async function WalletPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const [{ data: txns }, { data: withdrawals }, { data: rewardSettings }, { data: balance, error: balanceError }] = await Promise.all([
    supabase
      .from("wallet_transactions")
      .select("id,type,category,amount,description,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    // RLS: withdrawal_requests_select_own — only this user's requests.
    supabase
      .from("withdrawal_requests")
      .select("status,wallet_transaction_id")
      .eq("user_id", user.id)
      .not("wallet_transaction_id", "is", null),
    supabase.from("reward_settings").select("min_payout").eq("id", 1).maybeSingle(),
    supabase.rpc("wallet_available_balance"),
  ]);

  if (balanceError || balance === null) throw new Error("Wallet balance is unavailable. Please retry.");
  const availableBalance = Number(balance);
  const withdrawalStatusByTxn = new Map<string, WithdrawalStatus>(
    (withdrawals ?? []).map((w) => [w.wallet_transaction_id as string, w.status as WithdrawalStatus]),
  );
  const hasPendingWithdrawal = (withdrawals ?? []).some((w) => w.status === "pending");
  const minPayout = Number(rewardSettings?.min_payout ?? 0);

  return (
    <div>
      <AccountPageHeader title="Wallet" description="Referral credit, top-ups and spending — all in one place." />
      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent-violet px-6 py-6 text-white">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
            <Wallet className="h-4 w-4" aria-hidden /> Current balance
          </div>
          <div className="relative mt-1 font-display text-4xl font-bold">{formatINR(availableBalance)}</div>
        </div>
        <div className="px-6 pb-6 pt-1">
          <p className="mt-4 text-sm font-semibold text-ink">Top up your wallet</p>
          <TopUpForm />
          <p className="mt-6 text-sm font-semibold text-ink">Withdraw to UPI</p>
          <WithdrawForm balance={availableBalance} minPayout={minPayout} hasPending={hasPendingWithdrawal} />
        </div>
      </div>

      <h2 className="h-section mt-10">Transaction history</h2>
      {!txns || txns.length === 0 ? (
        <EmptyState className="mt-4" icon={Receipt} title="No transactions yet" subtitle="Top-ups, referral credit, withdrawals and purchases will appear here." />
      ) : (
        <div className="card mt-4 divide-y divide-line overflow-hidden">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
              <div>
                <div className="text-ink">{t.description || t.category}</div>
                <div className="text-xs text-ink-faint">
                  {timeAgo(t.created_at)}
                  {withdrawalStatusByTxn.has(t.id) && (
                    <> · {WITHDRAWAL_STATUS_LABEL[withdrawalStatusByTxn.get(t.id) as WithdrawalStatus]}</>
                  )}
                </div>
              </div>
              <div className={t.type === "credit" ? "font-semibold text-success" : "font-semibold text-danger"}>
                {t.type === "credit" ? "+" : "-"}
                {formatINR(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

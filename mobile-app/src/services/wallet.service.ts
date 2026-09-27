import { supabase } from "@/lib/supabase";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import type { WalletTransaction, WalletSummary, WalletTopUpOrder, WithdrawalStatus } from "@/types";

function mapTransactionRow(row: any): WalletTransaction {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    amount: row.amount,
    description: row.description,
    createdAt: row.created_at,
  };
}

/** Same pattern the request_withdrawal RPC enforces (migration 0144); the DB is authoritative. */
const UPI_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}$/;

export function isValidUpiId(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.length <= 100 && UPI_ID_PATTERN.test(v);
}

/**
 * Attaches each withdrawal hold debit's request status (RLS: own rows only).
 * Display-only: balances come from the ledger alone, so a failed status
 * lookup leaves the transactions unlabelled rather than failing the screen.
 */
async function withWithdrawalStatus(userId: string, transactions: WalletTransaction[]): Promise<WalletTransaction[]> {
  if (!transactions.some((t) => t.category === "withdrawal" && t.type === "debit")) return transactions;
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("status, wallet_transaction_id")
    .eq("user_id", userId)
    .not("wallet_transaction_id", "is", null);
  if (error || !data) return transactions;
  const byTxn = new Map<string, WithdrawalStatus>(data.map((r: any) => [r.wallet_transaction_id, r.status]));
  return transactions.map((t) => (byTxn.has(t.id) ? { ...t, withdrawalStatus: byTxn.get(t.id) } : t));
}

export const walletService = {
  async getWalletSummary(userId: string): Promise<WalletSummary> {
    // Money screen: a failed fetch must surface as an error to the hook
    // (react-query `isError` -> <ErrorState>), never as fabricated balances.
    // An empty ledger is NOT an error — a new student legitimately has one,
    // and the maths below produces a genuine ₹0 summary for it.
    const res = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (res.error) throw new Error(res.error.message);

    const transactions = await withWithdrawalStatus(userId, (res.data ?? []).map(mapTransactionRow));

    const sumBy = (predicate: (t: WalletTransaction) => boolean) =>
      transactions.filter(predicate).reduce((sum, t) => sum + t.amount, 0);

    const totalAdded = sumBy((t) => t.type === "credit" && t.category === "added_money");
    const totalReferralEarnings = sumBy((t) => t.type === "credit" && t.category === "referral_bonus");
    const totalCashback = sumBy((t) => t.type === "credit" && t.category === "cashback");
    const totalUsed = sumBy((t) => t.type === "debit" && (t.category === "project_purchase" || t.category === "mock_test_purchase"));

    // Wallet balance only reflects money actually moved through the
    // wallet (top-ups, referral bonuses, cashback, withdrawals). Project
    // purchases are usually paid directly via Razorpay (UPI/card/etc.),
    // not from wallet funds, so they're excluded here even though they're
    // still logged as activity and shown in "Total Used" below — otherwise
    // a UPI purchase would incorrectly drain the wallet balance.
    const walletCredits = sumBy((t) => t.type === "credit");
    const walletDebits = sumBy((t) => t.type === "debit" && t.category === "withdrawal");

    return {
      balance: Math.max(0, walletCredits - walletDebits),
      totalAdded,
      totalUsed,
      totalCashback,
      totalReferralEarnings,
      recentTransactions: transactions.slice(0, 10),
    };
  },

  async getAllTransactions(userId: string): Promise<WalletTransaction[]> {
    // Transaction history is real money data: propagate a failed fetch instead
    // of returning a sample ledger. An empty list is the correct answer for a
    // new student and is returned as-is.
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return withWithdrawalStatus(userId, (data ?? []).map(mapTransactionRow));
  },

  /** Creates a Razorpay order for topping up the wallet (server-side, via Edge Function). */
  async createTopUpOrder(amount: number): Promise<WalletTopUpOrder> {
    const { data, error } = await supabase.functions.invoke("create-wallet-topup-order", { body: { amount } });
    if (error) throw new Error(error.message);
    return {
      orderId: data.orderId,
      razorpayOrderId: data.razorpayOrderId,
      razorpayKeyId: data.razorpayKeyId,
      amount: data.amount,
      currency: data.currency,
    };
  },

  /** Verifies the Razorpay payment server-side before crediting the wallet. */
  async openCheckout(order: WalletTopUpOrder, customer: { name?: string; email?: string; contact?: string }) {
    return openRazorpayCheckout({
      key: order.razorpayKeyId,
      order_id: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      name: "CampusEduX Wallet",
      description: "Add money to wallet",
      prefill: customer,
      theme: { color: "#4F39F6" },
    });
  },

  async verifyTopUp(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<void> {
    const { error } = await supabase.functions.invoke("verify-wallet-topup-payment", { body: params });
    if (error) throw new Error(error.message);
  },

  /**
   * Withdrawals aren't instant (no payout/KYC integration in this build) —
   * this holds the amount (debit) and queues a pending withdrawal_requests row
   * that the admin team approves / rejects (refunded) / marks paid, rather
   * than pretending money was transferred.
   */
  async requestWithdrawal(userId: string, amount: number, upiId: string): Promise<void> {
    // Money movement: a failure here must never look like success. The balance
    // check, concurrency guard and ledger insert all happen server-side in one
    // transaction (request_withdrawal RPC, migrations 0038/0144) — the client can no
    // longer insert a withdrawal row directly, so it can't over-withdraw or
    // race two requests against the same balance. The RPC uses auth.uid()
    // server-side; userId is kept in the signature for the caller/hook.
    const { error } = await supabase.rpc("request_withdrawal", {
      p_amount: amount,
      p_upi_id: upiId,
    });
    if (error) throw new Error(`Couldn't submit your withdrawal request: ${error.message}`);
  },
};

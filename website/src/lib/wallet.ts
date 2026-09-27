export interface WalletBalanceTxn {
  type: "credit" | "debit";
  category: string;
  amount: number | string;
}

/**
 * Wallet balance only reflects money that actually moved through the wallet
 * (top-ups, referral bonuses, cashback, withdrawals). Project/mock-test
 * purchases are paid directly via Razorpay, not from wallet funds, so their
 * debit rows are excluded here even though they're still logged as activity
 * in the transaction history — otherwise a direct purchase would incorrectly
 * drain the wallet balance. Mirrors mobile-app/src/services/wallet.service.ts.
 */
export function computeWalletBalance(transactions: readonly WalletBalanceTxn[]): number {
  const credits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const debits = transactions
    .filter((t) => t.type === "debit" && t.category === "withdrawal")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  return Math.max(0, credits - debits);
}

/** Same pattern the request_withdrawal RPC enforces (migration 0144); the DB is authoritative. */
const UPI_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}$/;

export function isValidUpiId(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.length <= 100 && UPI_ID_PATTERN.test(v);
}

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected · refunded",
  paid: "Paid",
};

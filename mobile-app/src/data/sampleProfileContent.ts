import type { WalletSummary, WalletTransaction, PurchaseHistoryItem } from "@/types";

/**
 * Sample content for Module 8 (Profile). The profile and wallet service
 * reads try Supabase first and fall back here so the 12 screens render like
 * the mockups before the database is seeded.
 */

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

const tx = (
  id: string,
  type: WalletTransaction["type"],
  category: WalletTransaction["category"],
  amount: number,
  description: string,
  days: number
): WalletTransaction => ({ id, type, category, amount, description, createdAt: daysAgo(days) });

export const SAMPLE_WALLET_TRANSACTIONS: WalletTransaction[] = [
  tx("wt-1", "credit", "added_money", 500, "Added Money", 2),
  tx("wt-2", "debit", "project_purchase", 299, "Project Purchase", 4),
  tx("wt-3", "debit", "mock_test_purchase", 49, "Mock Test Purchase", 5),
  tx("wt-4", "credit", "referral_bonus", 200, "Referral Bonus", 7),
  tx("wt-5", "credit", "added_money", 1000, "Added Money", 12),
  tx("wt-6", "credit", "cashback", 50, "Cashback", 14),
  tx("wt-7", "debit", "project_purchase", 402, "Project Purchase", 18),
  tx("wt-8", "credit", "referral_bonus", 100, "Referral Bonus", 22),
];

export const SAMPLE_WALLET_SUMMARY: WalletSummary = {
  balance: 1250,
  totalAdded: 2000,
  totalUsed: 750,
  totalCashback: 200,
  totalReferralEarnings: 1250,
  recentTransactions: SAMPLE_WALLET_TRANSACTIONS.slice(0, 6),
};

export const SAMPLE_PURCHASE_HISTORY: PurchaseHistoryItem[] = [
  { id: "ph-1", type: "project", title: "E-Commerce Website", amount: 299, purchasedAt: daysAgo(2), status: "completed" },
  { id: "ph-2", type: "course", title: "Java Programming Course", amount: 499, purchasedAt: daysAgo(4), status: "completed" },
  { id: "ph-3", type: "test", title: "Aptitude Mock Test Pack", amount: 99, purchasedAt: daysAgo(6), status: "completed" },
  { id: "ph-4", type: "course", title: "DSA Course", amount: 599, purchasedAt: daysAgo(8), status: "completed" },
  { id: "ph-5", type: "project", title: "Web Development Project", amount: 399, purchasedAt: daysAgo(12), status: "completed" },
];

export interface ProfileEditableFields {
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string | null;
  gender: string | null;
  location: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
}

export type WalletTransactionCategory =
  | "referral_bonus"
  | "added_money"
  | "project_purchase"
  | "mock_test_purchase"
  | "cashback"
  | "withdrawal";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  category: WalletTransactionCategory;
  amount: number;
  description: string;
  createdAt: string;
  /** Set on the withdrawal hold debit from its withdrawal_requests row (migration 0144). */
  withdrawalStatus?: WithdrawalStatus;
}

export interface WalletSummary {
  balance: number;
  totalAdded: number;
  totalUsed: number;
  totalCashback: number;
  totalReferralEarnings: number;
  recentTransactions: WalletTransaction[];
}

export interface WalletTopUpOrder {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
}

export type PurchaseHistoryType = "project" | "course" | "test";

export interface PurchaseHistoryItem {
  id: string;
  type: PurchaseHistoryType;
  title: string;
  amount: number;
  purchasedAt: string;
  status: "completed" | "pending" | "failed";
}

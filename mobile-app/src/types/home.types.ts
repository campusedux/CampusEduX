export type NotificationCategory = "offers" | "updates" | "messages";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  /** Optional image attached by an admin-composed push. */
  imageUrl?: string | null;
}

export interface ReferralSummary {
  code: string;
  shareLink: string;
  totalReferrals: number;
  totalEarned: number;
  /** Flat ₹ reward from reward_settings; null when unreadable or the rule is a percent. */
  referrerBonus: number | null;
  /** Percent-of-order reward from reward_settings; null unless the rule is a percent. */
  referrerBonusPercent: number | null;
  /** From reward_settings; null when it couldn't be read (hide the "how you earn" amounts). */
  rewardOnSignup: boolean | null;
  rewardOnFirstPurchase: boolean | null;
}

export interface OfferBanner {
  id: string;
  title: string;
  description: string;
  discountLabel: string;
  couponCode: string;
}

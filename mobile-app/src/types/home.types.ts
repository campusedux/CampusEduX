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
  referrerBonus: number;
  refereeDiscountPercent: number;
}

export interface OfferBanner {
  id: string;
  title: string;
  description: string;
  discountLabel: string;
  couponCode: string;
}

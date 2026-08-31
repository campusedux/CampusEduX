export type BillingCycle = "monthly" | "yearly";

export interface PremiumPlan {
  id: string;
  name: string;
  tier: "basic" | "premium" | "premium_plus";
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscountPercent: number;
  isPopular: boolean;
  features: string[];
}

export interface PremiumFeature {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface MembershipDetails {
  subscriptionId: string;
  planName: string;
  billingCycle: BillingCycle;
  price: number;
  status: SubscriptionStatus;
  memberSince: string;
  nextBillingDate: string | null;
  paymentMethod: string;
  autoRenew: boolean;
  includedFeatures: string[];
}

export interface PremiumOrder {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  planPrice: number;
  gst: number;
  totalAmount: number;
  planName: string;
  billingCycle: BillingCycle;
}

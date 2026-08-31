import type { PremiumPlan, PremiumFeature, MembershipDetails } from "@/types";

/**
 * Sample content for Module 10 (Premium). Each premium service read tries
 * Supabase first and falls back here so the 5 screens render like the
 * mockups before the database is seeded.
 */

const yearly = (monthly: number) => Math.round(monthly * 12 * 0.6);

export const SAMPLE_PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: "plan-basic",
    name: "Basic",
    tier: "basic",
    monthlyPrice: 199,
    yearlyPrice: yearly(199),
    yearlyDiscountPercent: 40,
    isPopular: false,
    features: ["Access to limited projects", "5 Mock Tests / month", "Basic Support"],
  },
  {
    id: "plan-premium",
    name: "Premium",
    tier: "premium",
    monthlyPrice: 499,
    yearlyPrice: yearly(499),
    yearlyDiscountPercent: 40,
    isPopular: true,
    features: ["Access to all projects", "Unlimited Mock Tests", "ATS Resume Analyzer", "Priority Support"],
  },
  {
    id: "plan-premium-plus",
    name: "Premium Plus",
    tier: "premium_plus",
    monthlyPrice: 999,
    yearlyPrice: yearly(999),
    yearlyDiscountPercent: 40,
    isPopular: false,
    features: ["Everything in Premium", "1-on-1 Career Guidance", "Personalized Roadmap", "Early Access to New Features"],
  },
];

export const SAMPLE_PREMIUM_FEATURES: PremiumFeature[] = [
  { id: "pf-1", icon: "infinite-outline", title: "Unlimited Access", subtitle: "Access all projects, notes, and resources" },
  { id: "pf-2", icon: "document-text-outline", title: "Premium Mock Tests", subtitle: "Unlimited placement & aptitude tests" },
  { id: "pf-3", icon: "reader-outline", title: "Resume Analyzer (ATS)", subtitle: "Advanced ATS score & suggestions" },
  { id: "pf-4", icon: "business-outline", title: "Company Specific Prep", subtitle: "Get company-wise questions & tests" },
  { id: "pf-5", icon: "flash-outline", title: "Priority Support", subtitle: "Faster response from our support team" },
  { id: "pf-6", icon: "ban-outline", title: "Ad-Free Experience", subtitle: "Learn without any interruptions" },
  { id: "pf-7", icon: "rocket-outline", title: "Early Access", subtitle: "Be the first to access new features" },
  { id: "pf-8", icon: "cloud-download-outline", title: "Download & Offline Access", subtitle: "Download notes & watch videos offline" },
  { id: "pf-9", icon: "book-outline", title: "Exclusive Content", subtitle: "Premium guides, e-books & more" },
];

export const SAMPLE_MEMBERSHIP: MembershipDetails = {
  subscriptionId: "sub-sample-1",
  planName: "Premium",
  billingCycle: "monthly",
  price: 499,
  status: "active",
  memberSince: new Date(Date.now() - 20 * 86_400_000).toISOString(),
  nextBillingDate: new Date(Date.now() + 10 * 86_400_000).toISOString(),
  paymentMethod: "UPI",
  autoRenew: true,
  includedFeatures: [
    "Access to all projects",
    "Unlimited Mock Tests",
    "ATS Resume Analyzer",
    "Company Specific Prep",
    "Priority Support",
    "Ad-Free Experience",
    "Early Access to New Features",
  ],
};

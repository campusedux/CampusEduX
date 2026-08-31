import { supabase } from "@/lib/supabase";

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Bundled fallback shown only when the `faqs` table can't be reached
 * (migration 008_cms_reviews_admin.sql not applied, or offline). Real content
 * is authored in the admin panel under Banner & CMS → FAQ.
 */
const FALLBACK_FAQS: HelpFaq[] = [
  {
    id: "f1",
    question: "How do I download a project I purchased?",
    answer:
      "Open My Projects from the drawer, tap the project, then Download Files. Purchases stay available for re-download and every version update.",
    category: "Projects",
  },
  {
    id: "f2",
    question: "How do refunds work?",
    answer:
      "Digital purchases are refundable within 7 days if the files are broken or not as described. Open the purchase and tap Request Refund, or email support with your order ID.",
    category: "Payments",
  },
  {
    id: "f3",
    question: "How do I change my course, branch or year?",
    answer:
      "Profile → Edit academic details. Your selections are saved to your account and used across placement prep and recommendations.",
    category: "Account",
  },
  {
    id: "f4",
    question: "How does the referral program work?",
    answer:
      "Share your code from Referral & Earn. When a friend signs up with it and makes their first purchase, the reward set by the CampusEduX team is credited to your wallet.",
    category: "Referral",
  },
  {
    id: "f5",
    question: "What does Premium include?",
    answer:
      "Premium unlocks all premium projects, unlimited mock tests, premium preparation notes and priority support. Manage it under Premium in the drawer.",
    category: "Premium",
  },
];

export const supportService = {
  async getFaqs(): Promise<HelpFaq[]> {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, question, answer, category")
        .eq("status", "active")
        .order("category")
        .order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []).length ? (data as HelpFaq[]) : FALLBACK_FAQS;
    } catch (error) {
      console.info(`[support.service] getFaqs: using fallback (${(error as Error).message})`);
      return FALLBACK_FAQS;
    }
  },
};

import { supabase } from "@/lib/supabase";
import { LEGAL } from "@/constants/legal";

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Bundled fallback shown only when the `faqs` table can't be reached or is
 * empty (migration 008_cms_reviews_admin.sql not applied, or offline). Real
 * content is authored in the admin panel under Banner & CMS → FAQ.
 *
 * Every claim here must match the in-app legal content (Terms §11/§13/§15,
 * Refund & Cancellation Policy §4/§6). Numbers come from legal.config.json so
 * they can't drift; anything the legal text leaves open is not promised here.
 */
const FALLBACK_FAQS: HelpFaq[] = [
  {
    id: "f1",
    question: "How do I download a project I purchased?",
    answer:
      "Open My Projects from the drawer, tap the project, then Download Files. Access to purchased files is tied to your account and your entitlement, so download and keep your own copies while your access is active.",
    category: "Projects",
  },
  {
    id: "f2",
    question: "How do refunds work?",
    answer: `Email ${LEGAL.supportEmail} from your registered email within ${LEGAL.rules.refundRequestWindowDays} days of the transaction, with your order ID (see Purchase History) and the reason. Before a project is downloaded, a refund may be granted if it is materially not as described or is technically broken. Once project files have been downloaded or accessed, the purchase is generally non-refundable. See Refund & Cancellation Policy under Legal for the full rules.`,
    category: "Payments",
  },
  {
    id: "f3",
    question: "How do I change my course, branch or year?",
    answer:
      "Go to Profile → Change Academic Details. Your selections are saved to your account and used across placement prep and recommendations.",
    category: "Account",
  },
  {
    id: "f4",
    question: "How does the referral program work?",
    answer:
      "Share your code from Referral & Earn. Rewards are credited to your wallet according to the rules configured in the app at the time (for example, on a referred user's first purchase). Referral rewards are promotional credits, not cash. Self-referrals and misuse are not allowed. The current rule is shown on the Referral & Earn screen.",
    category: "Referral",
  },
  {
    id: "f5",
    question: "What does Premium include?",
    answer:
      "Premium is a paid subscription, billed monthly or yearly. The benefits are those described on the Premium screen at the time of purchase and may change over time. You can cancel from the app; cancellation stops future renewals and access continues until the end of the paid period.",
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

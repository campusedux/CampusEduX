import { Share2, UserPlus, Wallet } from "lucide-react";

/**
 * Three-step explainer. Step 3's timing comes from the configured reward rule
 * when the page has it (`rewardOnSignup`); otherwise it stays generic.
 */
export function ReferralHowItWorks({ rewardOnSignup }: { rewardOnSignup?: boolean }) {
  const steps = [
    { icon: Share2, title: "Share your link", body: "Send your personal referral link to friends — copy it or share straight to WhatsApp." },
    { icon: UserPlus, title: "A friend joins", body: "They create their CampusEduX account through your link." },
    {
      icon: Wallet,
      title: "You earn credit",
      body:
        rewardOnSignup === undefined
          ? "Referral credit is added to your CampusEduX wallet."
          : rewardOnSignup
            ? "Credit lands in your wallet as soon as they sign up."
            : "Credit lands in your wallet after their first purchase.",
    },
  ];
  return (
    <section aria-labelledby="how-referral-works">
      <h2 id="how-referral-works" className="h-section">
        How it works
      </h2>
      <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title} className="card relative min-w-0 p-4 md:p-5">
              <span className="absolute right-5 top-4 font-display text-3xl font-bold text-ink/10">{i + 1}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-pink/10">
                <Icon className="h-5 w-5 text-accent-pink" aria-hidden />
              </span>
              <p className="mt-2 font-display text-base font-semibold text-ink">{s.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{s.body}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default ReferralHowItWorks;

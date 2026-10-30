import { Gift } from "lucide-react";

/** Shared top panel for /referral and /account/referral. */
export function ReferralHero({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent-pink via-accent-violet to-primary px-5 py-8 text-white shadow-card md:px-8 md:py-10">
      <span aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-warning/25 blur-2xl" />
      <div className="relative">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-white/85 md:text-base">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

export default ReferralHero;

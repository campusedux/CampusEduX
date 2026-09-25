import { Gift } from "lucide-react";

/** Shared top panel for /referral and /account/referral. */
export function ReferralHero({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-pink via-accent-violet to-primary px-6 py-10 text-white shadow-card-lg sm:px-10 sm:py-12">
      <span aria-hidden className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-warning/25 blur-2xl" />
      <div className="relative">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
          <Gift className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-5 max-w-2xl font-display text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.6rem]">{title}</h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/85 sm:text-base">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

export default ReferralHero;

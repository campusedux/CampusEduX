import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BookOpen, Info, Lightbulb, Sparkles, Star } from "lucide-react";
import type { CalloutVariant } from "@/lib/callouts";
import { cn } from "@/lib/cn";

/** Literal class strings so Tailwind keeps them; tints read in both themes. */
const STYLE: Record<CalloutVariant, { icon: LucideIcon; box: string; fg: string }> = {
  tip: { icon: Lightbulb, box: "border-success/30 bg-success/[0.07]", fg: "text-success" },
  note: { icon: Info, box: "border-accent-sky/30 bg-accent-sky/[0.07]", fg: "text-accent-sky" },
  warning: { icon: AlertTriangle, box: "border-warning/40 bg-warning/[0.09]", fg: "text-amber-700 dark:text-amber-300" },
  definition: { icon: BookOpen, box: "border-primary/25 bg-primary/[0.06]", fg: "text-primary" },
  simple: { icon: Sparkles, box: "border-accent-teal/30 bg-accent-teal/[0.07]", fg: "text-teal-700 dark:text-teal-300" },
  key: { icon: Star, box: "border-accent-violet/30 bg-accent-violet/[0.07]", fg: "text-violet-700 dark:text-violet-300" },
};

/** A labelled lesson callout (Tip / Note / Warning / Definition / …). */
export function Callout({ variant, label, children }: { variant: CalloutVariant; label: string; children: React.ReactNode }) {
  const s = STYLE[variant];
  const Icon = s.icon;
  return (
    <aside className={cn("my-5 rounded-2xl border px-4 py-3.5 sm:px-5", s.box)} aria-label={label}>
      <p className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]", s.fg)}>
        <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
        {label}
      </p>
      <div className="mt-1.5 leading-7 text-ink">{children}</div>
    </aside>
  );
}

export default Callout;

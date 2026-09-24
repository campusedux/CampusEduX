import type { LucideIcon } from "lucide-react";
import { AlertTriangle, BookOpen, Info, Lightbulb, ListChecks, Sparkles, Star } from "lucide-react";
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

/**
 * A labelled lesson callout (Tip / Note / Warning / Definition / …).
 * `subtle` = a light left rule + small label, no filled box — for frequent,
 * short reminders that sit next to boxed callouts in the same lesson.
 */
export function Callout({
  variant,
  label,
  subtle = false,
  children,
}: {
  variant: CalloutVariant;
  label: string;
  subtle?: boolean;
  children: React.ReactNode;
}) {
  const s = STYLE[variant];
  const Icon = s.icon;
  if (subtle) {
    return (
      <aside className="my-5 border-l-2 border-accent-violet/35 py-0.5 pl-4" aria-label={label}>
        <p className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] opacity-80", s.fg)}>
          <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          {label}
        </p>
        <div className="mt-1 leading-7 text-ink-muted">{children}</div>
      </aside>
    );
  }
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

/**
 * "Quick revision" summary: Purpose / Main idea / Remember as separate rows in
 * one light box (no heavy fill — these sit beside "Teacher's simple view"
 * callouts in the same lessons).
 */
export function QuickRevision({ lines }: { lines: { label: string; body: React.ReactNode }[] }) {
  return (
    <aside className="my-5 rounded-2xl border border-line bg-surface/50 px-4 py-3 sm:px-5" aria-label="Quick revision">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        <ListChecks className="h-3.5 w-3.5" aria-hidden /> Quick revision
      </p>
      <dl className="mt-2 divide-y divide-line/70">
        {lines.map((l, i) => (
          <div key={i} className="grid gap-0.5 py-2 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted sm:pt-1">{l.label}</dt>
            <dd className="leading-7 text-ink">{l.body}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export default Callout;

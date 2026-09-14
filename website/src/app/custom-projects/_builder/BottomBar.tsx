import { cn } from "@/lib/cn";

/**
 * The 3-slot action bar at the foot of every wizard step (spec: left status /
 * center step counter / right primary action). Sticks to the bottom of the
 * viewport on mobile so the primary action is always reachable without a
 * second scroll — pass `sticky={false}` for a step whose content is short
 * enough that a mobile-sticky bar would float over the tail of it instead of
 * sitting below it (e.g. Estimate); it then renders as a normal in-flow card
 * on every breakpoint.
 */
export function BottomBar({
  step,
  totalSteps = 4,
  left,
  center,
  right,
  sticky = true,
  className,
}: {
  step: number;
  totalSteps?: number;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right: React.ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        sticky
          ? "sticky bottom-0 z-10 -mx-4 mt-8 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-5 sm:py-4 sm:shadow-card"
          : "static mx-0 mt-8 rounded-2xl border border-line bg-white px-4 py-3 shadow-card sm:px-5 sm:py-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm text-ink-muted">
          {left ?? (
            <span className="text-xs font-medium text-ink-faint">
              Step {step} of {totalSteps}
            </span>
          )}
        </div>
        <div className="hidden truncate px-2 text-xs font-medium text-ink-faint sm:block">
          {center ??
            (left ? (
              <>
                Step {step} of {totalSteps}
              </>
            ) : null)}
        </div>
        <div className="flex-shrink-0">{right}</div>
      </div>
    </div>
  );
}

export default BottomBar;

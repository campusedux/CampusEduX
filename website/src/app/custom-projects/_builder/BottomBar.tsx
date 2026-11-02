import { cn } from "@/lib/cn";

export function BottomBar({ step, totalSteps = 4, left, center, right, total, className }: {
  step: number; totalSteps?: number; left?: React.ReactNode; center?: React.ReactNode;
  right: React.ReactNode; total?: React.ReactNode; sticky?: boolean; className?: string;
}) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sm:px-6", className)}>
      <div className="mx-auto flex max-w-[1072px] items-center justify-between gap-2">
        <div className="min-w-0 text-sm text-ink-muted">{left}</div>
        <div className="hidden flex-1 truncate text-xs text-ink-faint sm:block">Step {step} of {totalSteps}{center && <> · {center}</>}</div>
        {total && <span className="ml-auto whitespace-nowrap text-sm font-semibold text-ink sm:hidden">{total}</span>}
        <div className="shrink-0">{right}</div>
      </div>
    </div>
  );
}
export default BottomBar;

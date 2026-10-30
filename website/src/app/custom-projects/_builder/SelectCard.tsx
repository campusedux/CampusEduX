import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Large selectable option card — project type / project level pickers.
 * Purple border + tint + check badge when selected, matching the OptionChips
 * selected state already used elsewhere in the builder.
 */
export function SelectCard({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "relative flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition active:scale-[.99] motion-reduce:transform-none",
        selected
          ? "border-primary bg-primary-50/60 shadow-card ring-2 ring-primary/20"
          : "border-line bg-card hover:border-primary/30 hover:bg-surface",
      )}
    >
      {selected && (
        <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-primary" aria-hidden />
      )}
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          selected ? "bg-primary text-white" : "bg-primary-50 text-primary",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 pr-6">
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">{title}{badge}</span>
        <span className="line-clamp-2 text-xs leading-5 text-ink-muted">{description}</span>
      </span>
    </button>
  );
}

export default SelectCard;

import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Filter / tag chip — mirrors `mobile-app/src/components/ui/Chip.tsx`.
 * Active = solid indigo; inactive = bordered. Renders a link when `href` is set.
 */
const base = "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition max-sm:min-h-11";
const state = (active: boolean) =>
  active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-muted hover:border-primary/40";

type ChipProps = {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Chip({
  active = false,
  href,
  onClick,
  className,
  children,
}: ChipProps & { href?: string; onClick?: () => void }) {
  const classes = cn(base, state(active), className);
  if (href) {
    return (
      <Link href={href} className={classes} aria-current={active ? "page" : undefined}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

/** Non-interactive tech/skill tag (project & job cards). */
export function TagPill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-lg bg-surface px-2 py-0.5 text-[0.68rem] font-medium text-ink-muted", className)}>
      {children}
    </span>
  );
}

export default Chip;

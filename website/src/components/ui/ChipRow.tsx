import { cn } from "@/lib/cn";

/** In-flow sticky wrapper: its parent must span the content it filters. */
export function ChipRow({ children, label, sticky = false, className }: {
  children: React.ReactNode;
  label: string;
  sticky?: boolean;
  className?: string;
}) {
  return <nav aria-label={label} className={cn("chip-row", sticky && "chip-row-sticky", className)}>{children}</nav>;
}

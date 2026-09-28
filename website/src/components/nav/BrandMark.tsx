import { cn } from "@/lib/cn";

/**
 * CampusEduX logo tile + wordmark, shared by the header and footer.
 * `compact` (header): below `sm` the wordmark is a little smaller and the gap tighter, and
 * below 360px only the logo tile shows, so the header's actions always fit the phone width.
 */
export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center", compact ? "gap-2 sm:gap-2.5" : "gap-2.5", className)}>
      <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-accent-violet text-base font-black text-white shadow-glow">
        <span aria-hidden className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/25" />
        <span className="relative font-display">C</span>
      </span>
      <span
        className={cn(
          "font-display font-bold tracking-tight text-ink",
          compact ? "text-[0.95rem] max-[359px]:hidden sm:text-[1.05rem]" : "text-[1.05rem]",
        )}
      >
        Campus<span className="text-primary">EduX</span>
      </span>
    </span>
  );
}

export default BrandMark;

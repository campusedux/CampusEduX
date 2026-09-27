import { cn } from "@/lib/cn";

/** CampusEduX logo tile + wordmark, shared by the header and footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-accent-violet text-base font-black text-white shadow-glow">
        <span aria-hidden className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/25" />
        <span className="relative font-display">C</span>
      </span>
      <span className="font-display text-[1.05rem] font-bold tracking-tight text-ink">
        Campus<span className="text-primary">EduX</span>
      </span>
    </span>
  );
}

export default BrandMark;

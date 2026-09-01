import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { href: "/custom-projects/start", label: "Details" },
  { href: "/custom-projects/features", label: "Features & files" },
  { href: "/custom-projects/estimate", label: "Estimate" },
  { href: "/custom-projects/checkout", label: "Payment" },
];

export default function StepBar({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="mb-8 flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const marker = (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold transition",
                done
                  ? "border-primary bg-primary text-white"
                  : active
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-line bg-white text-ink-faint",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                active ? "text-ink" : done ? "text-ink-muted" : "text-ink-faint",
              )}
            >
              {s.label}
            </span>
          </span>
        );
        return (
          <li key={s.href} className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3">
            {i <= current ? (
              <Link href={s.href} aria-current={active ? "step" : undefined} className="rounded-lg">
                {marker}
              </Link>
            ) : (
              marker
            )}
            {i < STEPS.length - 1 && (
              <span className={cn("h-px flex-1", done ? "bg-primary" : "bg-line")} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

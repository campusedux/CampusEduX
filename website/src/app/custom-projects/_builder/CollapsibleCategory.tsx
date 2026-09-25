"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Category group header with a collapse toggle — expanded by default. */
export function CollapsibleCategory({
  title,
  count,
  countLabel,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  countLabel: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-ink">{title}</span>
          <span className="text-xs text-ink-faint">
            {count} {countLabel}
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 flex-shrink-0 text-ink-faint transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="divide-y divide-line border-t border-line">{children}</div>}
    </div>
  );
}

export default CollapsibleCategory;

"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Drawer } from "./Drawer";

/**
 * Responsive filter container. Desktop (`lg+`) renders the filters inline as a
 * sidebar `<aside>`; mobile shows a "Filters" trigger that opens a bottom
 * `Drawer`. P5 supplies the actual filter controls as `children`.
 */
export function FilterSheet({
  title = "Filters",
  triggerLabel = "Filters",
  activeCount = 0,
  children,
}: {
  title?: string;
  triggerLabel?: string;
  activeCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: inline sidebar, sticky alongside the results column */}
      <aside className="hidden self-start lg:block lg:sticky lg:top-20">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="mb-4 font-bold text-ink">{title}</div>
          {children}
        </div>
      </aside>

      {/* Mobile: trigger + bottom drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {triggerLabel}
          {activeCount > 0 && (
            <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[0.7rem] font-bold text-white">{activeCount}</span>
          )}
        </button>
        <Drawer open={open} onClose={() => setOpen(false)} side="bottom" title={title}>
          <div className="p-5">{children}</div>
        </Drawer>
      </div>
    </>
  );
}

export default FilterSheet;

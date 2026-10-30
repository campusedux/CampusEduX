"use client";

import { useId, useState } from "react";
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
  iconOnly = false,
  children,
}: {
  title?: string;
  triggerLabel?: string;
  activeCount?: number;
  iconOnly?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  // Drawer content mounts only on the client. Namespace its opaque children's
  // DOM references at attachment, keeping both uncontrolled forms mounted and
  // retaining their values when the drawer closes or the viewport changes.
  const scopeDrawerIds = (container: HTMLDivElement | null) => {
    if (!container) return;
    const ids = new Map<string, string>();
    container.querySelectorAll<HTMLElement>("[id]").forEach((element) => {
      const id = element.id;
      const scoped = id.startsWith(`${drawerId}-`) ? id : `${drawerId}-${id}`;
      ids.set(id, scoped);
      element.id = scoped;
    });
    const references = ["for", "aria-labelledby", "aria-describedby", "aria-controls", "aria-activedescendant"];
    container.querySelectorAll<HTMLElement>(references.map((attribute) => `[${attribute}]`).join(",")).forEach((element) => {
      for (const attribute of references) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, value.split(/\s+/).map((id) => ids.get(id) ?? id).join(" "));
      }
    });
  };

  return (
    <>
      {/* Desktop: inline sidebar, sticky alongside the results column */}
      <aside aria-label={title} className="hidden min-w-0 self-start lg:block lg:sticky lg:top-20">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card [&_input]:min-w-0 [&_input:not([type=radio]):not([type=hidden])]:min-h-11 [&_select]:min-h-11 [&_label:has(input[type=radio])]:min-h-11">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            {activeCount > 0 && <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary">{activeCount} active</span>}
          </div>
          {children}
        </div>
      </aside>

      {/* Mobile: trigger + bottom drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-label={iconOnly ? `${triggerLabel}${activeCount ? ` (${activeCount} active filters)` : ""}` : undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`relative inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-card text-sm font-semibold text-ink transition hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${iconOnly ? "w-11 shrink-0" : "w-full px-4 sm:w-auto"}`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          <span className={iconOnly ? "sr-only" : undefined}>{triggerLabel}</span>
          {activeCount > 0 && (
            <span className={`${iconOnly ? "absolute -right-1 -top-1" : "ml-0.5"} inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] font-bold text-white`}>{activeCount}<span className="sr-only"> active filters</span></span>
          )}
        </button>
        <Drawer open={open} onClose={() => setOpen(false)} side="bottom" title={title}>
          <div ref={scopeDrawerIds} className="min-w-0 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-5 [&_input]:min-w-0 [&_input:not([type=radio]):not([type=hidden])]:min-h-11 [&_select]:min-h-11 [&_input[type=radio]]:h-4 [&_input[type=radio]]:w-4 [&_label:has(input[type=radio])]:min-h-11 [&_label:has(input[type=radio])]:rounded-lg [&_label:has(input[type=radio])]:px-2 [&_label:has(input[type=radio])]:py-2 [&_label:has(input[type=radio])]:focus-within:ring-2 [&_label:has(input[type=radio])]:focus-within:ring-primary">{children}</div>
        </Drawer>
      </div>
    </>
  );
}

export default FilterSheet;

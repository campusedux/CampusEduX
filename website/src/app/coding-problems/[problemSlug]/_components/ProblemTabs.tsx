"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, LayoutGrid, Lightbulb, Ruler, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type TabId = "problem" | "examples" | "constraints" | "hints" | "editorial";

const META: Record<TabId, { label: string; icon: LucideIcon }> = {
  problem: { label: "Problem", icon: FileText },
  examples: { label: "Examples", icon: LayoutGrid },
  constraints: { label: "Constraints", icon: Ruler },
  hints: { label: "Hints", icon: Lightbulb },
  editorial: { label: "Editorial", icon: BookOpen },
};

const ORDER: TabId[] = ["problem", "examples", "constraints", "hints", "editorial"];

/**
 * The tabbed problem card in the left panel. Server-rendered content is handed
 * in as one `ReactNode` per section, so the full problem text / examples /
 * constraints / hints are all in the initial HTML for SEO; inactive panels stay
 * mounted (`hidden`) so switching tabs keeps scroll position and any expanded
 * hint. Only tabs that actually have content are shown.
 */
export function ProblemTabs({
  problem,
  examples,
  constraints,
  hints,
  editorial,
}: {
  problem: ReactNode;
  examples?: ReactNode;
  constraints?: ReactNode;
  hints?: ReactNode;
  editorial?: ReactNode;
}) {
  const slots: Record<TabId, ReactNode> = { problem, examples, constraints, hints, editorial };
  const tabs = ORDER.filter((id) => slots[id] != null && slots[id] !== false);
  const [active, setActive] = useState<TabId>("problem");
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const last = tabs.length - 1;
    const nextIndex =
      e.key === "Home" ? 0 : e.key === "End" ? last : e.key === "ArrowRight" ? Math.min(last, index + 1) : Math.max(0, index - 1);
    const nextId = tabs[nextIndex];
    setActive(nextId);
    tabRefs.current[nextId]?.focus();
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div
        role="tablist"
        aria-label="Problem sections"
        className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-line px-1.5 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((id, i) => {
          const { label, icon: Icon } = META[id];
          const selected = active === id;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-semibold outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-primary/30",
                selected ? "text-primary" : "text-ink-faint hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors",
                  selected ? "bg-primary" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="min-w-0 p-4 sm:p-5">
        {tabs.map((id) => (
          <div
            key={id}
            role="tabpanel"
            id={`${baseId}-panel-${id}`}
            aria-labelledby={`${baseId}-tab-${id}`}
            hidden={active !== id}
            tabIndex={0}
            className="outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            {slots[id]}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProblemTabs;

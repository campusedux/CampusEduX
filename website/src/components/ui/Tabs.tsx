"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Accessible tabs (WAI-ARIA tabs pattern): arrow keys / Home / End move
 * between tabs, only the active tab is in the tab order. Uncontrolled by
 * default; pass `value` + `onChange` to control it. `pill` = segmented
 * control look, `underline` = classic tab strip.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = "pill",
  className,
  listClassName,
}: {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
  listClassName?: string;
}) {
  const baseId = useId();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const active = value ?? inner;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = items[next].id;
    select(id);
    refs.current[id]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        className={cn(
          "flex max-w-full overflow-x-auto [scrollbar-width:none]",
          variant === "pill" ? "w-fit gap-1 rounded-xl bg-surface p-1" : "gap-5 border-b border-line",
          listClassName,
        )}
      >
        {items.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "whitespace-nowrap text-sm font-semibold transition",
                variant === "pill"
                  ? cn("h-9 rounded-lg px-3.5", selected ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink")
                  : cn(
                      "-mb-px border-b-2 pb-2.5",
                      selected ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink",
                    ),
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {items.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${baseId}-panel-${t.id}`}
          aria-labelledby={`${baseId}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="mt-5 animate-fade-in focus-visible:outline-none"
        >
          {t.id === active ? t.content : null}
        </div>
      ))}
    </div>
  );
}

export default Tabs;

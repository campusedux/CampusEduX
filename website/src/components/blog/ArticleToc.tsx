"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { TocItem } from "@/lib/blogText";

/**
 * Sticky in-article table of contents. Targets the same anchor ids
 * `Markdown.tsx` stamps on the rendered headings (`slugId`). Highlights the
 * section currently in view with an IntersectionObserver; falls back to a plain
 * link list when JS is off or the observer is unavailable.
 */
export function ArticleToc({ items, className }: { items: TocItem[]; className?: string }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || items.length === 0) return;
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -66% 0px", threshold: [0, 1] },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="On this page" className={cn("text-sm", className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">On this page</p>
      <ul className="space-y-1.5 border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-0.5 pl-3 transition-colors",
                item.level === 3 && "pl-6",
                activeId === item.id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-ink-muted hover:border-line hover:text-ink",
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default ArticleToc;

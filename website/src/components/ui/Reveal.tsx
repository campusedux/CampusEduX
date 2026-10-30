"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll-into-view entrance (spec §15). SSR renders children fully visible, so
 * there is no flash of hidden content and no dependency on JS for the page to
 * read correctly. On mount, only elements that are still below the fold get
 * armed: they fade + rise 8px the first time they scroll into view.
 *
 * Users with "reduce motion", or browsers without IntersectionObserver, keep
 * the plain visible render and nothing animates.
 */
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") return;

    // Already on screen at load → leave it be (avoids a one-frame flicker).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        state === "hidden" && "opacity-0 translate-y-2",
        state === "shown" && "translate-y-0 opacity-100 transition-all duration-200 ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Reveal;

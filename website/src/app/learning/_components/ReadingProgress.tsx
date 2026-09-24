"use client";

import { useEffect, useRef } from "react";

/**
 * Thin reading-progress bar pinned under the site header. Tracks how far the
 * reader is through the element with id `targetId` (the lesson article).
 * Writes the width straight to the DOM inside rAF — no React re-render per
 * scroll event.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || !bar.current) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const pct = total <= 0 ? (rect.top < 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / total));
      if (bar.current) bar.current.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 h-[3px] bg-transparent" aria-hidden>
      <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-primary via-accent-violet to-accent-pink" />
    </div>
  );
}

export default ReadingProgress;

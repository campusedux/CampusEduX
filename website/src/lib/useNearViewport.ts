"use client";

import { useEffect, useState, type RefObject } from "react";

type IntersectionObserverCtor = typeof IntersectionObserver;

/**
 * Calls `onVisible` exactly once, the first time `el` comes within
 * `rootMargin` of the viewport, then stops observing. Returns a cleanup that
 * cancels the observation (safe to call more than once).
 *
 * Without IntersectionObserver support (very old browsers, or a non-DOM
 * environment) it fires immediately — deferral is only ever an optimisation,
 * it must never withhold the content.
 *
 * `IO` is injectable so the logic is unit-testable in the Node test runner.
 */
export function whenNearViewport(
  el: Element,
  onVisible: () => void,
  {
    rootMargin = "200px",
    IO = typeof IntersectionObserver === "undefined" ? undefined : IntersectionObserver,
  }: { rootMargin?: string; IO?: IntersectionObserverCtor } = {},
): () => void {
  if (!IO) {
    onVisible();
    return () => {};
  }
  let done = false;
  const io = new IO(
    (entries) => {
      if (done || !entries.some((e) => e.isIntersecting)) return;
      done = true;
      io.disconnect();
      onVisible();
    },
    { rootMargin },
  );
  io.observe(el);
  return () => {
    done = true;
    io.disconnect();
  };
}

/**
 * `true` once the referenced element has come near the viewport (and stays
 * `true`). Used to defer mounting a heavy, below-the-fold client widget — e.g.
 * the Prism code editor on the stacked mobile coding-problem layout — until
 * the visitor scrolls toward it. The caller keeps a fixed-size placeholder in
 * the same box meanwhile, so the swap causes no layout shift.
 */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin = "200px"): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    return whenNearViewport(el, () => setNear(true), { rootMargin });
  }, [ref, rootMargin, near]);
  return near;
}

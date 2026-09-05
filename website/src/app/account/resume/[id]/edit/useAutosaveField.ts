"use client";

import { useEffect, useRef } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounces persisting `value` via `save`, reporting status through
 * `onStatusChange`. Skips the render right after mount — that value just
 * came from the server, there's nothing new to save yet.
 */
export function useAutosaveField<T>(
  value: T,
  save: (value: T) => Promise<{ ok: true } | { error: string }>,
  onStatusChange: (status: SaveStatus) => void,
  delayMs = 800,
) {
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef(value);
  latestValue.current = value;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onStatusChange("saving");
      save(latestValue.current).then((result) => {
        onStatusChange("ok" in result ? "saved" : "error");
      });
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

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
  const previousValue = useRef(value);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef(value);
  latestValue.current = value;

  useEffect(() => {
    if (Object.is(previousValue.current, value)) return;
    previousValue.current = value;
    let current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onStatusChange("saving");
      // A Server Action call also *rejects* on a transport failure (offline,
      // action-infra 5xx), not just resolves with `{ error }`. Without the
      // catch that becomes an unhandled rejection and the field is stuck
      // on "Saving…" forever — surface it as a normal save error instead.
      const pendingValue = latestValue.current;
      writes.current = writes.current.then(async () => {
        try {
          const result = await save(pendingValue);
          if (current) onStatusChange(result && typeof result === "object" && "ok" in result ? "saved" : "error");
        } catch {
          if (current) onStatusChange("error");
        }
      });
    }, delayMs);
    return () => {
      current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

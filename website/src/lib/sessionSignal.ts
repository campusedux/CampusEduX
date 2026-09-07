"use client";

/**
 * "The session may have changed — re-check it" ping for the navigation islands.
 *
 * `useSessionProfile` no longer holds a browser Supabase client, so it can't
 * listen to `supabase.auth.onAuthStateChange` anymore. Instead, the Group B
 * components that actually mutate auth — the login, register and logout pages,
 * which keep the browser SDK — call `emitSessionChange()` immediately after
 * signing in / out. Every mounted `useSessionProfile` then re-fetches
 * `/api/session`, so the header updates without a full reload.
 *
 * The `localStorage` write additionally wakes hooks in *other* tabs via the
 * `storage` event (a sign-out in one tab flips the nav in the rest).
 */

type Listener = () => void;

const listeners = new Set<Listener>();
const PING_KEY = "cex_session_ping";

/** Notify every mounted `useSessionProfile` (this tab + others) to re-check. */
export function emitSessionChange(): void {
  listeners.forEach((fn) => fn());
  try {
    // The value only has to differ from the previous one to fire `storage`
    // in other tabs; it is never read back.
    window.localStorage.setItem(PING_KEY, String(Date.now()));
  } catch {
    /* storage blocked — same-tab listeners already ran */
  }
}

/** Subscribe to session-change pings (local + cross-tab). Returns an unsubscribe. */
export function subscribeSessionChange(fn: Listener): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PING_KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

"use client";

import { useEffect, useState } from "react";
import { subscribeSessionChange } from "@/lib/sessionSignal";

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isPremium: boolean;
}

/**
 * Client-side session + profile for the navigation islands (header auth menu,
 * mobile drawer, notification bell). Fetches the tiny `/api/session` endpoint —
 * which reads the cookie-bound `@supabase/ssr` server session — instead of
 * pulling a browser Supabase client. That keeps `@supabase/supabase-js`
 * (~67 kB gzip) out of every route's client bundle while the root layout stays
 * statically rendered; a server `auth.getUser()` in the layout would force
 * every page to dynamic rendering and break ISR on the public catalog.
 *
 * Auth transitions: `/login`, `/register` and `/logout` call `emitSessionChange()`
 * (see `@/lib/sessionSignal`) right after mutating the session, which makes
 * every mounted hook re-fetch — so the nav flips without a full reload. The
 * same ping crosses tabs via the `storage` event, and a tab regaining focus
 * re-checks too (covers a session that expired while the tab sat idle — the
 * case `supabase.auth.onAuthStateChange` used to handle).
 *
 * First paint is unchanged from the previous implementation: `loading: true`
 * until the first response resolves. Re-fetches never flip `loading` back to
 * true, so the header swaps in place with no skeleton flash or layout shift.
 *
 * The three mounted instances (`AuthMenu`, `NotificationBell`, `MobileNav`)
 * share one in-flight request via `pending`, so a page load / focus / auth
 * ping is a single `/api/session` round-trip, not three. An auth ping passes
 * `force` so it never reuses a request that started before the session changed.
 *
 * RLS: `/api/session` selects only the caller's own `profiles` row.
 */

type Result = { loading: boolean; profile: SessionProfile | null };

let pending: Promise<SessionProfile | null> | null = null;
let generation = 0;

function fetchProfile(force = false): Promise<SessionProfile | null> {
  if (pending && !force) return pending;
  const gen = ++generation;
  const run = (async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as { profile: SessionProfile | null };
      return data.profile ?? null;
    } catch {
      return null;
    } finally {
      // Only clear if a newer (forced) fetch hasn't since replaced `pending`.
      if (gen === generation) pending = null;
    }
  })();
  pending = run;
  return run;
}

export function useSessionProfile(): Result {
  const [state, setState] = useState<Result>({ loading: true, profile: null });

  useEffect(() => {
    let active = true;

    async function load(force = false) {
      const profile = await fetchProfile(force);
      if (active) setState({ loading: false, profile });
    }

    load();
    const unsubscribe = subscribeSessionChange(() => load(true));
    const onFocus = () => load(false);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return state;
}

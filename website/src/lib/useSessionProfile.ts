"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isPremium: boolean;
}

/**
 * Client-side session + profile for the navigation islands (header auth menu,
 * mobile drawer, bottom nav). Kept in Client Components on purpose so the root
 * layout stays static — a server `auth.getUser()` there would force every page
 * to dynamic rendering and break ISR on the public catalog.
 *
 * RLS: selects only the caller's own `profiles` row.
 */
export function useSessionProfile(): { loading: boolean; profile: SessionProfile | null } {
  const [state, setState] = useState<{ loading: boolean; profile: SessionProfile | null }>({
    loading: true,
    profile: null,
  });

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState({ loading: false, profile: null });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_premium, email")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setState({
        loading: false,
        profile: {
          id: user.id,
          email: p?.email ?? user.email ?? "",
          fullName: p?.full_name ?? "",
          avatarUrl: p?.avatar_url ?? null,
          isPremium: p?.is_premium ?? false,
        },
      });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

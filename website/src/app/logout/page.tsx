"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { emitSessionChange } from "@/lib/sessionSignal";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    createBrowserSupabase()
      .auth.signOut()
      .finally(() => {
        // Session cookie is cleared — flip the header nav to signed-out
        // (this tab and any others) without a reload.
        emitSessionChange();
        router.push("/");
        router.refresh();
      });
  }, [router]);
  return <div className="mx-auto max-w-sm px-6 py-16 text-center text-ink-muted">Signing out…</div>;
}

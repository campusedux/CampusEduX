"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { emitSessionChange } from "@/lib/sessionSignal";

export default function LogoutView() {
  const router = useRouter();
  useEffect(() => {
    createBrowserSupabase()
      .auth.signOut()
      .finally(() => {
        // Session cookie is cleared — flip the header nav to signed-out
        // (this tab and any others) without a reload.
        emitSessionChange();
        // replace (not push) so Back can't return to a signed-in page, and
        // refresh to drop the client router cache of the previous user's pages.
        router.replace("/");
        router.refresh();
      });
  }, [router]);
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center text-ink-muted sm:px-6">
      Signing out…
    </div>
  );
}

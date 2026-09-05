"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Calls report_shared_resume(token, reason) directly with the anon key —
 * no API route needed. The RPC is a narrow SECURITY DEFINER function that
 * validates the token before writing, so this never needs a service-role
 * key on the website.
 */
export default function ReportShareButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleReport() {
    setState("sending");
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.rpc("report_shared_resume", {
      p_token: token,
      p_reason: "Reported by a viewer via the share page.",
    });
    setState(error || !data ? "error" : "sent");
  }

  if (state === "sent") return <p className="text-xs text-ink-faint">Thanks — this link has been reported.</p>;

  return (
    <button
      type="button"
      onClick={handleReport}
      disabled={state === "sending"}
      className="flex items-center gap-1 text-xs text-ink-faint hover:text-danger disabled:opacity-50"
    >
      <Flag className="h-3 w-3" /> {state === "error" ? "Couldn't report — try again" : "Report this resume"}
    </button>
  );
}

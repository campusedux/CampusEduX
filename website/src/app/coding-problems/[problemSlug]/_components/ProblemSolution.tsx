"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";

type State = { code: Record<string, string>; locked: boolean; signedIn: boolean };

/**
 * Solution code for the Editorial tab. The page itself is rendered anonymously (cached), so the
 * solution is fetched per user from /api/problems/solution: it is returned only after the user has
 * submitted at least one attempt (or is admin). Otherwise a locked note is shown.
 */
export function ProblemSolution({ kind, slug }: { kind: "coding" | "practice"; slug: string }) {
  const [state, setState] = useState<State>({ code: {}, locked: true, signedIn: false });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/problems/solution?kind=${kind}&slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (res.status === 401) return setState({ code: {}, locked: true, signedIn: false });
      if (!res.ok) return;
      const body = (await res.json()) as { solution_code?: Record<string, string>; solution_locked?: boolean };
      setState({ code: body.solution_code ?? {}, locked: body.solution_locked === true, signedIn: true });
    } catch {
      /* keep the locked note */
    }
  }, [kind, slug]);

  useEffect(() => {
    void load();
    // A submission is made in the other pane: re-check when the user comes back to this tab/window.
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("cx:submission-recorded", load);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("cx:submission-recorded", load);
    };
  }, [load]);

  const entries = Object.entries(state.code).filter(([, code]) => !!code);
  return (
    <div className="space-y-3">
      {entries.map(([lang, code]) => (
        <div key={lang}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{lang}</p>
          <pre className="overflow-x-auto rounded-xl border border-line bg-surface/60 p-3 text-[13px] leading-relaxed text-ink">
            <code>{code}</code>
          </pre>
        </div>
      ))}
      {state.locked ? (
        <div
          role="note"
          data-testid="solution-locked"
          className="flex items-start gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2.5 text-sm text-ink-muted"
        >
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
          <span>Submit an attempt to unlock the solution.{state.signedIn ? "" : " (Sign in first.)"}</span>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Textarea, Button } from "@/components/ui";
import { matchResumeToJdAction, type JdMatchResult } from "@/lib/actions/resumeBuilder";

export default function JdMatchPanel({ resumeId }: { resumeId: string }) {
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<JdMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleCheck() {
    setChecking(true);
    setError(null);
    const outcome = await matchResumeToJdAction(resumeId, jdText);
    setChecking(false);
    if ("error" in outcome) {
      setError(outcome.error);
      setResult(null);
      return;
    }
    setResult(outcome);
  }

  return (
    <div className="mt-6 space-y-4">
      <Textarea
        rows={10}
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder="Paste the full job description here…"
      />
      <Button onClick={handleCheck} loading={checking} disabled={!jdText.trim()}>
        {checking ? "Checking…" : "Check match"}
      </Button>

      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      {result && (
        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-ink">{result.matchPercent}%</div>
            <div className="text-sm text-ink-muted">
              Resume match — {result.matched.length} of {result.jdKeywordCount} job-description keywords found
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-success">Matching keywords</h3>
              {result.matched.length === 0 ? (
                <p className="text-sm text-ink-faint">None found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.matched.map((k) => (
                    <span key={k} className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-danger">Missing keywords</h3>
              {result.missing.length === 0 ? (
                <p className="text-sm text-ink-faint">None — great coverage!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.missing.map((k) => (
                    <span key={k} className="rounded-lg bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

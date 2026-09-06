"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, XCircle, ChevronDown, Sparkles } from "lucide-react";

const RUNTIME_HINTS: Array<[RegExp, string]> = [
  [/NullPointerException/i, "Your code tried to use an object that was null."],
  [
    /ArrayIndexOutOfBoundsException|IndexError\b|list index out of range|index out of range/i,
    "Your code tried to access an index that doesn't exist.",
  ],
  [/ZeroDivisionError|ArithmeticException|division by zero/i, "Your code divided a number by zero."],
  [/NameError|cannot find symbol|is not defined/i, "Your code refers to a name that isn't defined."],
  [/ClassCastException/i, "Your code tried to treat a value as the wrong type."],
  [/TypeError/i, "Your code used a value of the wrong type."],
  [/StackOverflowError|RecursionError|maximum recursion depth/i, "Your code recursed too deeply — check the base case."],
  [/FileNotFoundException|No such file or directory/i, "Your code tried to open a file that doesn't exist."],
  [/KeyError/i, "Your code looked up a key that doesn't exist."],
  [/EOFError|NoSuchElementException/i, "Your code tried to read more input than was provided."],
];

function explainRuntimeError(detail: string): string {
  for (const [pattern, explanation] of RUNTIME_HINTS) {
    if (pattern.test(detail)) return explanation;
  }
  const firstLine = detail
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return firstLine ? firstLine.slice(0, 160) : "Your program crashed while running — see details below.";
}

const TONE = {
  runtime: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.07]",
    icon: "text-amber-400",
    heading: "text-amber-200",
    body: "text-amber-100/90",
    details: "text-amber-100/80",
  },
  compile: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.07]",
    icon: "text-red-400",
    heading: "text-red-200",
    body: "text-red-100/90",
    details: "text-red-100/80",
  },
} as const;

/**
 * Friendly replacement for a raw stderr/compiler-output dump: a short heading,
 * a one-line plain-language guess at the cause (a small pattern match over
 * common exception/error text — best-effort, not a real diagnosis), the full
 * trace collapsed behind "Show details", and an "Ask AI to fix" placeholder —
 * there's no backend wired up for it yet, so the click just acknowledges it.
 */
export function RuntimeErrorCard({
  kind,
  detail,
  hint,
}: {
  kind: "runtime" | "compile";
  detail: string;
  hint?: ReactNode;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [askedAi, setAskedAi] = useState(false);
  const tone = TONE[kind];
  const Icon = kind === "runtime" ? AlertTriangle : XCircle;
  const reason =
    kind === "runtime" ? explainRuntimeError(detail) : "Your code didn't compile — check the syntax error below.";

  // TODO: "Ask AI to fix" has no backend. To finish it, add a POST
  // /api/compiler/assist route modelled on /api/resume/assist (server-side
  // ANTHROPIC_API_KEY via src/lib/resumeBuilder/aiAssist.ts, a compiler-fix
  // system prompt, per-user rate limiting, and COMPILER_REQUIRE_AUTH-aware
  // auth), then render the returned suggestion as an accept/reject diff.
  // Left as a flagged stub in the Phase 2 cleanup: it's a feature build, not
  // a mechanical fix. Until then the click only acknowledges (label → "Coming
  // soon…" for 2s).
  function askAiToFix() {
    setAskedAi(true);
    setTimeout(() => setAskedAi(false), 2000);
  }

  return (
    <div role="alert" className={`space-y-2.5 rounded-xl border p-3.5 ${tone.border} ${tone.bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone.icon}`} aria-hidden />
        <p className={`text-sm font-semibold ${tone.heading}`}>
          {kind === "runtime" ? "Runtime error" : "Compilation error"}
        </p>
      </div>
      <p className={`text-sm ${tone.body}`}>{reason}</p>
      {hint}
      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className={`inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline ${tone.details}`}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} aria-hidden />
          {showDetails ? "Hide details" : "Show details"}
        </button>
        <button
          type="button"
          onClick={askAiToFix}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-primary-400/40 bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-200 transition hover:bg-primary-500/20 active:scale-[.98] motion-reduce:transform-none"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {askedAi ? "Coming soon…" : "Ask AI to fix"}
        </button>
      </div>
      {showDetails ? (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-black/25 p-2.5 text-xs text-slate-200">
          {detail || "No further details were returned."}
        </pre>
      ) : null}
    </div>
  );
}

export default RuntimeErrorCard;

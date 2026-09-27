"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { useNearViewport } from "@/lib/useNearViewport";

/**
 * The code-editor cell of the compiler panel. Reuses the existing
 * `<CodeEditor>` (Prism-highlighted textarea overlay: line numbers, indent,
 * Tab, Ctrl/Cmd+Enter) — loaded client-only, exactly as `/compiler` does — and
 * just frames it to fill the resizable editor row.
 *
 * Performance: the Prism editor chunk is fetched and mounted only once this
 * cell is near the viewport. On desktop the split layout keeps it on screen, so
 * that is immediately after hydration; on the stacked mobile layout (problem
 * statement first) it waits until the visitor scrolls toward the editor, so
 * the statement — the page's LCP — paints and hydrates without competing with
 * it. The same fixed-size placeholder box is shown until then (no layout
 * shift), and code state / Run / Run Tests / Submit / drafts all live in
 * `CodingProblemWorkspace`, so they work whether or not the editor has mounted.
 */
const CodeEditor = dynamic(() => import("../../../compiler/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-[#0f172a] text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

export function CodeEditorPanel({
  ready,
  code,
  onChange,
  prismLanguage,
  ariaLabel,
  onRun,
  theme,
  fontSize,
}: {
  ready: boolean;
  code: string;
  onChange: (next: string) => void;
  prismLanguage: string;
  ariaLabel: string;
  onRun: () => void;
  theme: "dark" | "light";
  fontSize?: number;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(cellRef);

  return (
    <div ref={cellRef} className="h-full min-h-0">
      {ready && near ? (
        <CodeEditor
          value={code}
          onChange={onChange}
          language={prismLanguage}
          onRun={onRun}
          ariaLabel={ariaLabel}
          theme={theme}
          fontSize={fontSize}
          className="h-full"
        />
      ) : (
        <div
          className={cn(
            "h-full rounded-xl border",
            theme === "light" ? "border-line bg-white" : "border-white/10 bg-[#0f172a]",
          )}
        />
      )}
    </div>
  );
}

export default CodeEditorPanel;

"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

/**
 * The code-editor cell of the compiler panel. Reuses the existing
 * `<CodeEditor>` (Prism-highlighted textarea overlay: line numbers, indent,
 * Tab, Ctrl/Cmd+Enter) — loaded client-only, exactly as `/compiler` does — and
 * just frames it to fill the resizable editor row.
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
  return (
    <div className="h-full min-h-0">
      {ready ? (
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

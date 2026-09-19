"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { LanguageDef } from "@/lib/compiler/languages";
import { useResizableSplit } from "@/lib/compiler/useResizableSplit";
import {
  CODING_LAYOUT_DEFAULTS,
  loadCodingEditorTheme,
  loadCodingLayout,
  saveCodingEditorTheme,
  saveCodingLayout,
  type CodingEditorTheme,
} from "@/lib/compiler/codingLayout";
import { CompilerToolbar } from "./CompilerToolbar";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { IOPanel } from "./IOPanel";
import { InputPanel } from "./InputPanel";
import { OutputPanel } from "./OutputPanel";
import { ResizeHandle } from "./ResizeHandle";

export interface CompilerPanelProps {
  ready: boolean;
  languages: LanguageDef[];
  languageId: string;
  onLanguageChange: (id: string) => void;
  code: string;
  onCodeChange: (next: string) => void;
  prismLanguage: string;
  editorAriaLabel: string;
  stdin: string;
  onStdinChange: (next: string) => void;
  exampleInputs: string[];
  onClearStdin: () => void;
  onClearOutput: () => void;
  onRun: () => void;
  onRunTests: () => void;
  /** When set, a "Submit" button appears beside "Run Tests". */
  onSubmit?: () => void;
  onReset: () => void;
  busy: boolean;
  /** Signed-out visitor: Run / Run Tests / Submit are disabled with a hint. */
  signInRequired?: boolean;
  canClearOutput: boolean;
  output: ReactNode;
}

/**
 * The dark IDE column: sticky toolbar, then a vertically-resizable editor over
 * the Input/Output row. Owns only layout + the editor-theme toggle; every run /
 * judge / reset action is passed in from `CodingProblemWorkspace`, so the
 * compiler behaviour and API calls are untouched.
 */
export function CompilerPanel(props: CompilerPanelProps) {
  const {
    ready,
    languages,
    languageId,
    onLanguageChange,
    code,
    onCodeChange,
    prismLanguage,
    editorAriaLabel,
    stdin,
    onStdinChange,
    exampleInputs,
    onClearStdin,
    onClearOutput,
    onRun,
    onRunTests,
    onSubmit,
    onReset,
    busy,
    signInRequired,
    canClearOutput,
    output,
  } = props;

  const [theme, setTheme] = useState<CodingEditorTheme>("dark");
  useEffect(() => {
    setTheme(loadCodingEditorTheme());
  }, []);
  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      saveCodingEditorTheme(next);
      return next;
    });
  }

  const split = useResizableSplit({
    axis: "y",
    initial: CODING_LAYOUT_DEFAULTS.editor,
    min: 25,
    max: 82,
    minFirstPx: 250,
    minSecondPx: 180,
    handlePx: 12,
    persist: { load: () => loadCodingLayout("editor"), save: (p) => saveCodingLayout("editor", p) },
  });

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-[#0b1120] shadow-card lg:h-full lg:rounded-none lg:border-0">
      <div className="shrink-0">
        <CompilerToolbar
          languages={languages}
          languageId={languageId}
          onLanguageChange={onLanguageChange}
          theme={theme}
          onToggleTheme={toggleTheme}
          onReset={onReset}
          onRun={onRun}
          onRunTests={onRunTests}
          onSubmit={onSubmit}
          busy={busy}
          signInRequired={signInRequired}
        />
      </div>

      <div
        ref={split.containerRef}
        className="flex flex-col gap-3 p-3 lg:grid lg:min-h-0 lg:flex-1 lg:gap-0 lg:grid-rows-[var(--eh)_12px_minmax(0,1fr)]"
        style={{ "--eh": `${split.pct}%` } as React.CSSProperties}
      >
        <div className="h-[52vh] min-h-[250px] lg:h-auto lg:min-h-0">
          <CodeEditorPanel
            ready={ready}
            code={code}
            onChange={onCodeChange}
            prismLanguage={prismLanguage}
            ariaLabel={editorAriaLabel}
            onRun={onRunTests}
            theme={theme}
          />
        </div>

        <ResizeHandle
          handleProps={split.handleProps}
          orientation="horizontal"
          tone="dark"
          label="Resize code editor and input/output"
        />

        <div className="min-w-0 lg:min-h-0">
          <IOPanel
            input={
              <InputPanel
                value={stdin}
                onChange={onStdinChange}
                onClear={onClearStdin}
                exampleInputs={exampleInputs}
              />
            }
            output={<OutputPanel onClear={onClearOutput} canClear={canClearOutput}>{output}</OutputPanel>}
          />
        </div>
      </div>
    </div>
  );
}

export default CompilerPanel;

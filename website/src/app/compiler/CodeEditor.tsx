"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
// JavaScript grammar ships in Prism core.
import "./editor.css";

/**
 * Zero-dependency-*framework* code editor: a transparent <textarea> layered over
 * a Prism-highlighted <pre>, with a synced line-number gutter.
 *
 * Only `/compiler` pulls this in (`next/dynamic`, `ssr:false`), so Prism never
 * loads on a Learning page or any other route. The <code> layer is filled with
 * `Prism.highlight()` output, which HTML-escapes the source before tokenising —
 * the value shown is the user's own code in their own browser session.
 */
Prism.manual = true;

const TAB = "  "; // two spaces per indent

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface CodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  /** Prism grammar name, e.g. "java", "python", "cpp". */
  language: string;
  /** Fired on Ctrl/Cmd+Enter. */
  onRun?: () => void;
  ariaLabel?: string;
  className?: string;
  /** Editor text size in px. Defaults to 13. */
  fontSize?: number;
  /** Fired whenever the caret moves, for a status-bar "Ln X, Col Y" readout. */
  onCursorChange?: (pos: CursorPosition) => void;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  onRun,
  ariaLabel = "Code editor",
  className,
  fontSize = 13,
  onCursorChange,
}: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const highlighted = useMemo(() => {
    const src = value.endsWith("\n") ? value : value + "\n";
    const grammar = Prism.languages[language];
    if (grammar) {
      try {
        return Prism.highlight(src, grammar, language);
      } catch {
        /* fall through */
      }
    }
    return escapeHtml(src);
  }, [value, language]);

  const lineCount = useMemo(() => value.split("\n").length, [value]);

  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }, []);

  useLayoutEffect(syncScroll, [value, syncScroll]);

  const reportCursor = useCallback(() => {
    const ta = taRef.current;
    if (!ta || !onCursorChange) return;
    const upToCaret = ta.value.slice(0, ta.selectionStart);
    const lines = upToCaret.split("\n");
    onCursorChange({ line: lines.length, column: lines[lines.length - 1].length + 1 });
  }, [onCursorChange]);

  useLayoutEffect(reportCursor, [value, reportCursor]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onRun?.();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: start, selectionEnd: end } = ta;
      onChange(value.slice(0, start) + TAB + value.slice(end));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + TAB.length;
        reportCursor();
      });
    }
    // Other keys (typing, arrows, Home/End, …) are covered by the textarea's onKeyUp.
  };

  const fontStyle: React.CSSProperties = { fontSize };

  return (
    <div
      className={`relative flex overflow-hidden rounded-xl border border-line bg-[#0f172a] font-mono leading-[1.5] ${className ?? ""}`}
      style={fontStyle}
    >
      <div
        ref={gutterRef}
        aria-hidden
        className="select-none overflow-hidden py-3 pl-3 pr-2 text-right font-mono leading-[1.5] text-slate-500"
        style={{ minWidth: "2.75rem", ...fontStyle }}
      >
        <div>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>

      <div className="relative flex-1">
        <pre
          ref={preRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre px-3 py-3 font-mono leading-[1.5] text-slate-100 [scrollbar-width:none] [tab-size:2] [&::-webkit-scrollbar]:hidden"
          style={fontStyle}
        >
          <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          onClick={reportCursor}
          onKeyUp={reportCursor}
          onSelect={reportCursor}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          aria-label={ariaLabel}
          style={fontStyle}
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent px-3 py-3 font-mono leading-[1.5] text-transparent caret-slate-100 outline-none selection:bg-primary/40 [scrollbar-width:thin] [tab-size:2]"
        />
      </div>
    </div>
  );
}

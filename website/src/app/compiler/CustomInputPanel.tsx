"use client";

import { TerminalSquare, ChevronDown } from "lucide-react";

/**
 * Compact "Custom Input (stdin)" row shared by `/compiler` and the coding-problem
 * workspace. Collapsed by default (a slim clickable row); expands in place with a
 * lightweight CSS-grid height transition — no JS height measurement, no library.
 * Purely presentational: the caller owns `stdin` state and wires it into the
 * same Run request it always has.
 */
export function CustomInputPanel({
  open,
  onToggle,
  value,
  onChange,
  placeholder = "Text passed to your program's standard input",
  label = "Custom Input (stdin)",
}: {
  open: boolean;
  onToggle: () => void;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium text-ink"
      >
        <span className="inline-flex items-center gap-2">
          <TerminalSquare className="h-4 w-4 text-ink-muted" aria-hidden />
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="block w-full resize-y border-t border-line bg-white px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}

export default CustomInputPanel;

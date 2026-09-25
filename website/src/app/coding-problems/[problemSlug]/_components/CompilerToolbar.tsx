"use client";

import { ChevronDown, FileCode2, ListChecks, Loader2, Moon, Play, RotateCcw, Send, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LanguageDef } from "@/lib/compiler/languages";
import { cn } from "@/lib/cn";

/**
 * The sticky IDE toolbar: language picker on the left, editor-theme toggle +
 * Reset + Run + Run Tests (+ optional Submit) on the right. All actions are
 * passed in — this component owns no run/judge logic. When `onSubmit` is
 * provided (the global Practice route), Submit is the primary purple CTA and
 * Run Tests steps down to a secondary button.
 */
export function CompilerToolbar({
  languages,
  languageId,
  onLanguageChange,
  theme,
  onToggleTheme,
  onReset,
  onRun,
  onRunTests,
  onSubmit,
  busy,
  signInRequired = false,
}: {
  languages: LanguageDef[];
  languageId: string;
  onLanguageChange: (id: string) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onReset: () => void;
  onRun: () => void;
  onRunTests: () => void;
  onSubmit?: () => void;
  busy: boolean;
  signInRequired?: boolean;
}) {
  const off = busy || signInRequired;
  const hint = signInRequired ? "Sign in to run code" : undefined;
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0f172a]/95 px-3 py-2.5 backdrop-blur">
      {/* Language */}
      <div className="relative">
        <FileCode2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-300" aria-hidden />
        <select
          value={languageId}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Programming language"
          className="h-9 appearance-none rounded-lg border border-white/15 bg-white/5 pl-8 pr-8 text-sm font-semibold text-slate-100 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id} className="bg-white text-ink">
              {l.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch editor to light theme" : "Switch editor to dark theme"}
          aria-label={theme === "dark" ? "Switch editor to light theme" : "Switch editor to dark theme"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
        </button>

        <ToolbarButton icon={RotateCcw} label="Reset" onClick={onReset} disabled={busy} />
        <span title={hint} className="inline-flex"><ToolbarButton icon={busy ? undefined : Play} label="Run" onClick={onRun} disabled={off} loading={busy} /></span>

        {onSubmit ? (
          <span title={hint} className="inline-flex"><ToolbarButton icon={busy ? undefined : ListChecks} label="Run Tests" onClick={onRunTests} disabled={off} loading={busy} /></span>
        ) : (
          <button
            type="button"
            onClick={onRunTests}
            disabled={off}
            title={hint ?? "Run all test cases"}
            aria-label={hint ?? "Run all test cases"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ListChecks className="h-4 w-4" aria-hidden />}
            Run Tests
          </button>
        )}

        {onSubmit ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={off}
            title={hint ?? "Submit — run every test case and save the attempt"}
            aria-label={hint ?? "Submit solution"}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Submit
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition",
        "hover:bg-white/10 hover:text-white active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden />
      ) : null}
      {label}
    </button>
  );
}

export default CompilerToolbar;

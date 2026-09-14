"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LanguageDef } from "@/lib/compiler/languages";
import { cn } from "@/lib/cn";

/**
 * The compact IDE toolbar for the standalone Online Compiler: language picker
 * on the left; editor-theme toggle, copy / download, editor settings, fullscreen,
 * Reset and Run on the right. Owns no run logic — every action is passed in from
 * `CompilerWorkspace`, which still owns language state, drafts and the
 * `/api/compiler/run` call.
 */
export function CompilerToolbar({
  languages,
  languageId,
  onLanguageChange,
  theme,
  onToggleTheme,
  fontSize,
  fontMin,
  fontMax,
  onFontSize,
  fullscreen,
  onToggleFullscreen,
  onCopyCode,
  copiedCode,
  onDownload,
  onReset,
  onRun,
  busy,
}: {
  languages: LanguageDef[];
  languageId: string;
  onLanguageChange: (id: string) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  fontSize: number;
  fontMin: number;
  fontMax: number;
  onFontSize: (delta: number) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onCopyCode: () => void;
  copiedCode: boolean;
  onDownload: () => void;
  onReset: () => void;
  onRun: () => void;
  busy: boolean;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSettingsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0f172a]/95 px-3 py-2.5 backdrop-blur">
      {/* Language — left */}
      <div className="relative">
        <FileCode2
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-300"
          aria-hidden
        />
        <label htmlFor="compiler-language" className="sr-only">
          Language
        </label>
        <select
          id="compiler-language"
          value={languageId}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="h-9 appearance-none rounded-lg border border-white/15 bg-white/5 pl-8 pr-8 text-sm font-semibold text-slate-100 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id} className="bg-white text-ink">
              {l.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>

      {/* Actions — right */}
      <div className="ml-auto flex items-center gap-1.5">
        <IconButton title="Copy code" onClick={onCopyCode}>
          {copiedCode ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </IconButton>
        <IconButton title="Download source file" onClick={onDownload}>
          <Download className="h-4 w-4" aria-hidden />
        </IconButton>
        <IconButton
          title={theme === "dark" ? "Switch editor to light theme" : "Switch editor to dark theme"}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
        </IconButton>

        <div ref={settingsRef} className="relative">
          <IconButton
            title="Editor settings"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
          >
            <Settings className="h-4 w-4" aria-hidden />
          </IconButton>
          {settingsOpen ? (
            <div
              aria-label="Editor settings"
              className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-white/10 bg-[#0f172a] p-3 shadow-card-lg animate-scale-in"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Font size</p>
              <div className="flex items-center justify-between rounded-lg border border-white/15">
                <IconButton
                  title="Decrease font size"
                  onClick={() => onFontSize(-1)}
                  disabled={fontSize <= fontMin}
                  className="border-0"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </IconButton>
                <span className="select-none text-center text-sm font-medium text-slate-100" aria-hidden>
                  {fontSize}px
                </span>
                <IconButton
                  title="Increase font size"
                  onClick={() => onFontSize(1)}
                  disabled={fontSize >= fontMax}
                  className="border-0"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </IconButton>
              </div>
            </div>
          ) : null}
        </div>

        <IconButton
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={onToggleFullscreen}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
        </IconButton>

        <LabelButton icon={RotateCcw} label="Reset" onClick={onReset} disabled={busy} />
        <button
          type="button"
          onClick={onRun}
          disabled={busy}
          title="Run code"
          aria-label="Run code"
          aria-keyshortcuts="Control+Enter"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {busy ? "Running…" : "Run"}
        </button>
      </div>
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
  disabled,
  className,
  "aria-expanded": ariaExpanded,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition",
        "hover:bg-white/10 hover:text-slate-100 active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transform-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

function LabelButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
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
        "hover:bg-white/10 hover:text-white active:scale-[.98] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transform-none",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

export default CompilerToolbar;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Play, ExternalLink } from "lucide-react";
import { isRunnableLanguage, resolveLanguage } from "@/lib/compiler/languages";
import { buildCompilerHref, HANDOFF_STORAGE_KEY } from "@/lib/compiler/handoff";

/**
 * Fenced code block for Learning content. Renders exactly like the previous
 * inline `<pre>` in `Markdown.tsx` (dark surface, language label) and adds a
 * small toolbar:
 *
 *   • Copy               — always
 *   • Run / Open compiler — only when the fence language is one the
 *                           `/compiler` page can execute
 *
 * "Run" opens `/compiler` with this code preloaded and auto-runs it; large
 * snippets are handed over via `sessionStorage` instead of the URL.
 */
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const runnable = isRunnableLanguage(lang);
  const canonical = resolveLanguage(lang)?.id ?? lang;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  function openInCompiler(autorun: boolean) {
    const { href, handoff } = buildCompilerHref({ language: canonical, code, autorun });
    if (handoff) {
      try {
        window.sessionStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(handoff));
      } catch {
        /* fall back to a language-only compiler open */
      }
    }
    router.push(href);
  }

  return (
    <div className="group relative my-4">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        {runnable ? (
          <>
            <ToolbarButton onClick={() => openInCompiler(true)} label="Run this code in the CampusEduX compiler">
              <Play className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Run</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => openInCompiler(false)} label="Open this code in the CampusEduX compiler">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Compiler</span>
            </ToolbarButton>
          </>
        ) : null}
        <ToolbarButton onClick={copy} label={copied ? "Code copied" : "Copy code"}>
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </ToolbarButton>
      </div>

      <pre tabIndex={0} aria-label={lang ? `${lang} code` : "Code"} className="overflow-x-auto rounded-xl border border-line bg-[#0f172a] p-4 pt-9 text-[13px] leading-relaxed text-slate-100 sm:pt-4">
        {lang ? (
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{lang}</div>
        ) : null}
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hit-44 inline-flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      {children}
    </button>
  );
}

export default CodeBlock;

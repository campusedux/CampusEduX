"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

const EVENT = "cex:toast";
let seq = 0;

/**
 * Fire-and-forget notification, callable from any client code:
 *   toast({ title: "Saved", tone: "success" })
 * Implemented as a window event consumed by the single <Toaster/> in the root
 * layout — no React context, so it works outside the component tree too.
 */
export function toast(input: { title: string; description?: string; tone?: ToastTone }): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: { id: ++seq, tone: input.tone ?? "info", ...input } }));
}

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const ICON_CLS: Record<ToastTone, string> = { success: "text-success", error: "text-danger", info: "text-primary" };
const DURATION_MS = 4500;

/** Renders the toast stack (bottom-centre on mobile above the tab bar, bottom-right on desktop). */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const item = (e as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev.slice(-2), item]);
      window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== item.id)), DURATION_MS);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[150] flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end"
    >
      {items.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-card-lg"
          >
            <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", ICON_CLS[t.tone])} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              className="rounded-md p-0.5 text-ink-faint transition hover:bg-surface hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Toaster;

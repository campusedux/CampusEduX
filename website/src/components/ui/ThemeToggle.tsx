"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { applyThemePreference, readThemePreference, type ThemePreference } from "@/lib/theme";

const ORDER: ThemePreference[] = ["light", "dark", "system"];
const META: Record<ThemePreference, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Monitor },
};

/**
 * Theme control.
 * - `icon` (header): one round button that cycles Light → Dark → System.
 * - `segmented` (drawer / settings): all three options side by side.
 * Renders a neutral placeholder until mounted, since the stored preference is
 * only readable on the client.
 */
export function ThemeToggle({ variant = "icon", className }: { variant?: "icon" | "segmented"; className?: string }) {
  const [pref, setPref] = useState<ThemePreference | null>(null);

  useEffect(() => {
    setPref(readThemePreference());
    // Keep "system" live when the OS theme flips while the page is open.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readThemePreference() === "system") applyThemePreference("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const choose = (next: ThemePreference) => {
    setPref(next);
    applyThemePreference(next);
  };

  if (variant === "segmented") {
    return (
      <div role="radiogroup" aria-label="Theme" className={cn("grid grid-cols-3 gap-1 rounded-xl bg-surface p-1", className)}>
        {ORDER.map((p) => {
          const { label, icon: Icon } = META[p];
          const active = pref === p;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(p)}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition",
                active ? "bg-card text-ink shadow-card" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  const current = pref ?? "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = META[current].icon;
  return (
    <button
      type="button"
      onClick={() => choose(next)}
      aria-label={`Theme: ${META[current].label}. Switch to ${META[next].label}`}
      title={`Theme: ${META[current].label}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-primary/40 hover:bg-surface hover:text-primary",
        className,
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", pref === null && "opacity-0")} aria-hidden />
    </button>
  );
}

export default ThemeToggle;

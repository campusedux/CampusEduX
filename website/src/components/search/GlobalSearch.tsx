"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2, CornerDownLeft, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  type GlobalSearchResult,
  type SearchResultItem,
  type SearchGroupType,
  sanitizeSearchTerm,
  isSearchableTerm,
  withQuery,
} from "@/lib/searchModel";
import { GROUP_ICON } from "./groupMeta";

/* ------------------------------------------------------------------------- *
 * Suggestions hook — debounced `GET /api/search`, per-term memo, abortable.
 * ------------------------------------------------------------------------- */
function useSuggest(rawTerm: string) {
  const term = sanitizeSearchTerm(rawTerm);
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, GlobalSearchResult>());
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isSearchableTerm(term)) {
      abort.current?.abort();
      setLoading(false);
      setResult(null);
      return;
    }
    const hit = cache.current.get(term);
    if (hit) {
      setResult(hit);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    const t = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as GlobalSearchResult;
        cache.current.set(term, data);
        if (live) setResult(data);
      } catch (err) {
        if (live && (err as Error)?.name !== "AbortError") setResult({ q: term, groups: [], total: 0 });
      } finally {
        if (live) setLoading(false);
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [term]);

  return { term, result, loading };
}

/* ------------------------------------------------------------------------- *
 * Enhanced search field + suggestions dropdown.
 * ------------------------------------------------------------------------- */
export function GlobalSearchField({
  variant = "header",
  defaultValue = "",
  autoFocus = false,
  showSubmit,
  onNavigate,
  className,
}: {
  variant?: "header" | "page";
  defaultValue?: string;
  autoFocus?: boolean;
  showSubmit?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);

  const { term, result, loading } = useSuggest(value);
  const withSubmit = showSubmit ?? variant === "page";

  const items: SearchResultItem[] = useMemo(
    () => result?.groups.flatMap((g) => g.items) ?? [],
    [result],
  );
  const searchable = isSearchableTerm(term);
  const open = focused && searchable && (loading || !!result);
  // Flat keyboard targets: every result row, then the "view all" row.
  const targetCount = items.length + (searchable ? 1 : 0);

  useEffect(() => setActive(-1), [term]);
  useEffect(() => {
    // Close the panel after any client navigation.
    setFocused(false);
  }, [pathname]);

  useEffect(() => {
    if (active >= 0) optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setFocused(false);
      onNavigate?.();
      router.push(href);
    },
    [router, onNavigate],
  );

  const submit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const t = sanitizeSearchTerm(value);
      if (!t) {
        inputRef.current?.focus();
        return;
      }
      go(withQuery("/search", t));
    },
    [value, go],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!targetCount) return;
      e.preventDefault();
      setFocused(true);
      setActive((i) => (i + 1) % targetCount);
    } else if (e.key === "ArrowUp") {
      if (!targetCount) return;
      e.preventDefault();
      setActive((i) => (i <= 0 ? targetCount - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && active >= 0) {
        e.preventDefault();
        if (active < items.length) go(items[active].href);
        else submit();
      }
      // else: let the <form> submit → handleSubmit → /search?q=
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setFocused(false);
      }
    }
  };

  const wrap =
    variant === "header"
      ? "flex h-10 w-44 items-center gap-2 rounded-full border border-line bg-surface px-4 transition-[width,background-color,border-color,box-shadow] focus-within:w-60 focus-within:border-primary focus-within:bg-card focus-within:shadow-sm 2xl:w-64 2xl:focus-within:w-72"
      : "flex h-11 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 focus-within:border-primary focus-within:bg-card";

  const placeholder = "Search CampusEduX…";
  // The compact header field is narrow — keep its visible hint short; the
  // accessible name stays the full phrase.
  const visiblePlaceholder = variant === "header" ? "Search…" : placeholder;

  return (
    <form
      ref={rootRef}
      role="search"
      action="/search"
      method="get"
      onSubmit={submit}
      className={cn("relative", variant === "page" && "flex w-full items-center gap-2", className)}
    >
      <div className={wrap}>
        <Search className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={visiblePlaceholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {loading && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-ink-faint" aria-hidden />}
      </div>

      {withSubmit && (
        <button
          type="submit"
          className="h-11 flex-shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          Search
        </button>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className={cn(
            "absolute z-[70] mt-2 max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-card py-1 shadow-card-lg",
            variant === "header" ? "right-0 top-full w-[22rem]" : "left-0 right-0 top-full",
          )}
        >
          {items.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">
              No matches for “{term}”.
            </p>
          ) : (
            <SuggestBody
              result={result}
              activeIndex={active}
              listId={listId}
              onPick={go}
              registerRef={(i, el) => (optionRefs.current[i] = el)}
            />
          )}

          {searchable && (
            <button
              type="button"
              id={`${listId}-opt-${items.length}`}
              role="option"
              aria-selected={active === items.length}
              ref={(el) => {
                optionRefs.current[items.length] = el;
              }}
              onMouseEnter={() => setActive(items.length)}
              onClick={() => submit()}
              className={cn(
                "mt-1 flex w-full items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-primary",
                active === items.length ? "bg-surface" : "hover:bg-surface",
              )}
            >
              <span className="inline-flex items-center gap-2">
                View all results
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
              {result && result.total > 0 && (
                <span className="text-xs font-normal text-ink-faint">{result.total}</span>
              )}
            </button>
          )}
        </div>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------------- *
 * Dropdown body — groups with a labelled header + rows.
 * ------------------------------------------------------------------------- */
function SuggestBody({
  result,
  activeIndex,
  listId,
  onPick,
  registerRef,
}: {
  result: GlobalSearchResult | null;
  activeIndex: number;
  listId: string;
  onPick: (href: string) => void;
  registerRef: (index: number, el: HTMLElement | null) => void;
}) {
  if (!result) {
    return (
      <p className="flex items-center gap-2 px-4 py-6 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Searching…
      </p>
    );
  }

  let flat = -1;
  return (
    <>
      {result.groups.map((group) => {
        const Icon = GROUP_ICON[group.type as SearchGroupType];
        return (
          <div key={group.type} className="py-1">
            <p className="flex items-center gap-1.5 px-4 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {group.label}
              <span className="font-normal normal-case tracking-normal text-ink-faint/70">
                {group.total}
              </span>
            </p>
            {group.items.map((item) => {
              flat += 1;
              const idx = flat;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`${listId}-opt-${idx}`}
                  role="option"
                  aria-selected={activeIndex === idx}
                  ref={(el) => registerRef(idx, el)}
                  onClick={() => onPick(item.href)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-2.5 text-left",
                    activeIndex === idx ? "bg-surface" : "hover:bg-surface",
                  )}
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-ink">{item.title}</span>
                      {item.isPremium && (
                        <span className="flex-shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-warning">
                          Premium
                        </span>
                      )}
                    </span>
                    {item.subtitle && (
                      <span className="mt-0.5 block truncate text-xs text-ink-faint">{item.subtitle}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------------- *
 * Mobile (< lg) — icon button that opens a top search sheet.
 * ------------------------------------------------------------------------- */
export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // The site header carries `backdrop-filter`, which makes it the containing
  // block for `position: fixed` descendants — a fixed overlay rendered inline
  // would be clipped to the 64px header. Portal it to <body> instead.
  const overlay =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] xl:hidden">
            <div className="absolute inset-0 bg-scrim/60" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute inset-x-0 top-0 border-b border-line bg-card p-3 shadow-card-lg">
              <div className="container-page flex items-center gap-2">
                <GlobalSearchField
                  variant="page"
                  autoFocus
                  showSubmit={false}
                  onNavigate={() => setOpen(false)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <p className="container-page mt-2 hidden items-center gap-1 text-xs text-ink-faint sm:flex">
                <CornerDownLeft className="h-3 w-3" aria-hidden />
                Press Enter to see all results
              </p>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search CampusEduX"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-primary/40 hover:bg-surface hover:text-primary xl:hidden"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
      {overlay}
    </>
  );
}

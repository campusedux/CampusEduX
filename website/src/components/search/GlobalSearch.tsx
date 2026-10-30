"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { Search, CornerDownLeft, X, ArrowRight } from "lucide-react";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useDialog } from "@/lib/useDialog";
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
  const [failedTerm, setFailedTerm] = useState<string | null>(null);
  const cache = useRef(new Map<string, GlobalSearchResult>());
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    setFailedTerm(null);
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
    setResult(null);
    setLoading(true);
    const t = setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as GlobalSearchResult;
        if (live) {
          cache.current.set(term, data);
          setResult(data);
        }
      } catch (err) {
        if (live && (err as Error)?.name !== "AbortError") setFailedTerm(term);
      } finally {
        if (live) setLoading(false);
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
      abort.current?.abort();
    };
  }, [term]);

  return { term, result, loading, error: failedTerm === term };
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
  const previousPathname = useRef(pathname);
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useState(defaultValue);
  useEffect(() => setValue(defaultValue), [defaultValue]);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);

  const { term, result, loading, error } = useSuggest(value);
  const withSubmit = showSubmit ?? variant === "page";

  const items: SearchResultItem[] = useMemo(
    () => result?.q === term ? result.groups.flatMap((g) => g.items) : [],
    [result, term],
  );
  const searchable = isSearchableTerm(term);
  const open = focused && searchable && (loading || !!result || error);
  // Flat keyboard targets: every result row, then the "view all" row.
  const targetCount = items.length + (searchable ? 1 : 0);

  useEffect(() => setActive(-1), [term]);
  useEffect(() => {
    // Close the panel after any client navigation.
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setFocused(false);
    }
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
      ? "flex h-11 min-w-0 w-44 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15 2xl:w-64"
      : "flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15 sm:px-3.5";

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
      className={cn("relative min-w-0", variant === "page" && "flex w-full items-center gap-1.5 sm:gap-2", className)}
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
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={visiblePlaceholder}
          aria-label={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          className="h-full min-w-0 w-full flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint sm:text-sm"
        />
        {loading && <Skeleton className="h-4 w-4 shrink-0 rounded-full" />}
      </div>

      {withSubmit && (
        <button
          type="submit"
          aria-label="Search"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary-600 sm:w-auto sm:px-4"
        >
          <ArrowRight className="h-4 w-4 sm:hidden" aria-hidden />
          <span className="sr-only sm:not-sr-only">Search</span>
        </button>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "absolute z-chips mt-2 max-h-[min(60dvh,24rem)] overflow-y-auto overscroll-contain rounded-lg border border-line bg-card py-1 shadow-card-lg",
            variant === "header" ? "right-0 top-full w-[22rem] max-w-[calc(100vw-2rem)]" : "left-0 right-0 top-full",
          )}
        >
          {error ? (
            <p role="alert" className="px-4 py-6 text-sm text-ink-muted">
              Couldn’t load search suggestions. Try again or view all results.
            </p>
          ) : items.length === 0 && !loading ? (
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
              tabIndex={-1}
              aria-selected={active === items.length}
              ref={(el) => {
                optionRefs.current[items.length] = el;
              }}
              onMouseEnter={() => setActive(items.length)}
              onClick={() => submit()}
              className={cn(
                "mt-1 flex min-h-11 w-full items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-primary",
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
      <div role="status" className="min-w-0 p-3">
        <span className="sr-only">Searching…</span>
        <div aria-hidden className="space-y-3">
          <SkeletonCard variant="job" />
          <SkeletonCard variant="job" />
        </div>
      </div>
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
              <span className="font-normal normal-case tracking-normal text-ink-faint">
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
                  tabIndex={-1}
                  aria-selected={activeIndex === idx}
                  ref={(el) => registerRef(idx, el)}
                  onClick={() => onPick(item.href)}
                  className={cn(
                    "flex min-h-11 w-full items-start gap-3 px-4 py-2.5 text-left",
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
                        <Badge variant="pro" className="shrink-0">
                          Premium
                        </Badge>
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  const dialogRef = useDialog(open && mounted, () => setOpen(false), triggerRef);

  // The site header carries `backdrop-filter`, which makes it the containing
  // block for `position: fixed` descendants — a fixed overlay rendered inline
  // would be clipped to the header's height. Portal it to <body> instead.
  const overlay =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-modal xl:hidden">
            <div className="absolute inset-0 bg-scrim/60" onClick={() => setOpen(false)} aria-hidden />
            <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Search CampusEduX" className="absolute inset-x-0 top-0 border-b border-line bg-card pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-card-lg">
              <div className="container-page flex min-w-0 items-center gap-2 max-sm:px-3">
                <GlobalSearchField
                  variant="page"
                  autoFocus
                  showSubmit={false}
                  onNavigate={() => setOpen(false)}
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface"
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
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search CampusEduX"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition hover:border-primary/40 hover:bg-surface hover:text-primary xl:hidden"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
      {overlay}
    </>
  );
}

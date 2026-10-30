import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { GlobalSearchField } from "@/components/search/GlobalSearch";
import type { GlobalSearchResult } from "@/lib/searchModel";

type Slot = { value?: unknown; ran?: boolean; deps?: readonly unknown[]; cleanup?: () => void };
const hooks = vi.hoisted(() => ({ active: false, cursor: 0, dirty: false, slots: [] as Slot[], pending: [] as (() => void)[] }));
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navigation.push }), usePathname: () => "/" }));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  const slot = () => hooks.slots[hooks.cursor++] ?? (hooks.slots[hooks.cursor - 1] = {});
  return {
    ...actual,
    useState: ((initial: unknown) => {
      if (!hooks.active) return actual.useState(initial);
      const current = slot();
      if (!("value" in current)) current.value = typeof initial === "function" ? initial() : initial;
      return [current.value, (next: unknown) => {
        const value = typeof next === "function" ? next(current.value) : next;
        if (!Object.is(value, current.value)) { current.value = value; hooks.dirty = true; }
      }];
    }) as typeof actual.useState,
    useRef: ((initial: unknown) => {
      if (!hooks.active) return actual.useRef(initial);
      const current = slot();
      return current.value ?? (current.value = { current: initial });
    }) as typeof actual.useRef,
    useId: () => {
      if (!hooks.active) return actual.useId();
      const current = slot();
      return current.value ?? (current.value = `search-${hooks.cursor}`);
    },
    useMemo: ((factory: () => unknown, deps: readonly unknown[]) => hooks.active ? factory() : actual.useMemo(factory, deps)) as typeof actual.useMemo,
    useCallback: ((callback: () => unknown, deps: readonly unknown[]) => hooks.active ? callback : actual.useCallback(callback, deps)) as typeof actual.useCallback,
    useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
      if (!hooks.active) return actual.useEffect(effect, deps);
      const current = slot();
      if (!current.ran || !deps || !current.deps || deps.some((value, i) => !Object.is(value, current.deps![i]))) {
        current.ran = true;
        current.deps = deps;
        hooks.pending.push(() => {
          current.cleanup?.();
          const cleanup = effect();
          current.cleanup = typeof cleanup === "function" ? cleanup : undefined;
        });
      }
    },
  };
});

type Props = { children?: ReactNode; [key: string]: unknown };
function find(node: ReactNode, predicate: (node: ReactElement<Props>) => boolean): ReactElement<Props> | undefined {
  if (!isValidElement<Props>(node)) return undefined;
  if (predicate(node)) return node;
  for (const child of Children.toArray(node.props.children)) {
    const result = find(child, predicate);
    if (result) return result;
  }
}

// Exercise the real component/hook with controlled effects, timers and network
// completions. The Node runner has no DOM; browser focus/AT testing stays pending.
function field() {
  let tree: ReactElement;
  const render = () => {
    let attempts = 0;
    do {
      if (++attempts > 20) throw new Error("Search state did not settle");
      hooks.cursor = 0;
      hooks.dirty = false;
      hooks.pending = [];
      hooks.active = true;
      try { tree = GlobalSearchField({ variant: "page" }); } finally { hooks.active = false; }
      hooks.pending.forEach(effect => effect());
    } while (hooks.dirty);
  };
  render();
  const input = () => find(tree, node => node.type === "input")!;
  (input().props.onFocus as () => void)();
  render();
  return {
    change(value: string) { (input().props.onChange as (event: { target: { value: string } }) => void)({ target: { value } }); render(); },
    html() { render(); return renderToStaticMarkup(tree); },
    blur() { (input().props.onBlur as () => void)(); render(); },
    preservePointerFocus() {
      render();
      const popup = find(tree, node => node.props.role === "listbox")!;
      const preventDefault = vi.fn();
      (popup.props.onMouseDown as (event: { preventDefault: () => void }) => void)({ preventDefault });
      expect(preventDefault).toHaveBeenCalledOnce();
    },
    pick() {
      render();
      const press = (key: string) => (input().props.onKeyDown as (event: { key: string; preventDefault: () => void }) => void)({ key, preventDefault: vi.fn() });
      press("ArrowDown"); render(); press("Enter"); render();
    },
  };
}
function response(q: string, title?: string): GlobalSearchResult {
  return { q, total: title ? 3 : 0, groups: title ? [{ type: "learning", label: "Learning", allHref: `/learning?q=${q}`, total: 3, items: [{ id: q, title, href: `/learning/java/${q}` }] }] : [] };
}
const ok = (data: GlobalSearchResult) => ({ ok: true, json: async () => data });
function deferred() {
  let resolve!: (value: ReturnType<typeof ok>) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<ReturnType<typeof ok>>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const fetchMock = vi.fn();

beforeEach(() => {
  hooks.active = false; hooks.cursor = 0; hooks.dirty = false; hooks.slots = []; hooks.pending = [];
  fetchMock.mockReset(); navigation.push.mockReset();
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("document", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => {
  hooks.slots.forEach(slot => slot.cleanup?.());
  hooks.active = false;
  vi.useRealTimers(); vi.unstubAllGlobals();
});

describe("global search request states", () => {
  it("keeps suggestions outside the Tab order and releases the popup when focus leaves", async () => {
    fetchMock.mockResolvedValue(ok(response("loops", "Original lesson")));
    const search = field(); search.change("loops");
    await vi.advanceTimersByTimeAsync(200);
    const html = search.html();
    const options = [...html.matchAll(/<button\b[^>]*role="option"[^>]*>/g)];
    expect(options).toHaveLength(2);
    for (const [option] of options) expect(option).toContain('tabindex="-1"');
    expect(html).toContain('aria-controls=');
    search.preservePointerFocus();
    search.blur();
    const closed = search.html();
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).not.toContain('aria-controls=');
    expect(closed).not.toContain('role="listbox"');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("keeps the 200ms debounce, sanitized query endpoint and loading presentation", async () => {
    const pending = deferred(); fetchMock.mockReturnValue(pending.promise);
    const search = field(); search.change("  java & sql  ");
    expect(search.html()).toContain("Searching…");
    expect(search.html()).not.toContain("No matches");
    await vi.advanceTimersByTimeAsync(199);
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/search?q=java%20%26%20sql", { signal: expect.any(AbortSignal) });
    pending.resolve(ok(response("java & sql")));
    await vi.advanceTimersByTimeAsync(0);
    expect(search.html()).toContain("No matches");
    expect(search.html()).not.toContain('role="alert"');
  });

  it("renders real successful suggestions and preserves their detail destinations", async () => {
    fetchMock.mockResolvedValue(ok(response("loops", "Original lesson")));
    const search = field(); search.change("loops");
    await vi.advanceTimersByTimeAsync(200);
    expect(search.html()).toContain("Original lesson");
    expect(search.html()).not.toContain("No matches");
    expect(search.html()).not.toContain('role="alert"');
    search.pick();
    expect(navigation.push).toHaveBeenCalledWith("/learning/java/loops");
  });

  it.each(["network", "server"])("announces %s failures without claiming zero results", async failure => {
    if (failure === "network") fetchMock.mockRejectedValue(new Error("offline"));
    else fetchMock.mockResolvedValue({ ok: false, status: 503 });
    const search = field(); search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    const html = search.html();
    expect(html).toContain('role="alert"');
    expect(html).toContain("Couldn’t load search suggestions");
    expect(html).not.toContain("No matches");
    expect(html).not.toContain("Searching…");
    search.pick();
    expect(navigation.push).toHaveBeenCalledWith("/search?q=java");
  });

  it("clears a failure for the next query and does not cache failures", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(ok(response("sql"))).mockResolvedValueOnce(ok(response("java", "Recovered lesson")));
    const search = field(); search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    expect(search.html()).toContain('role="alert"');
    search.change("sql");
    expect(search.html()).toContain("Searching…");
    expect(search.html()).not.toContain('role="alert"');
    await vi.advanceTimersByTimeAsync(200);
    expect(search.html()).toContain("No matches");
    search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    expect(search.html()).toContain("Recovered lesson");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ignores a stale failure after a newer successful response", async () => {
    const old = deferred();
    fetchMock.mockReturnValueOnce(old.promise).mockResolvedValueOnce(ok(response("sql", "New result")));
    const search = field(); search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    search.change("sql");
    expect(signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    old.reject(new Error("late network failure"));
    await vi.advanceTimersByTimeAsync(0);
    expect(search.html()).toContain("New result");
    expect(search.html()).not.toContain('role="alert"');
  });

  it("prevents stale successes from replacing current results or poisoning the cache", async () => {
    const old = deferred();
    fetchMock.mockReturnValueOnce(old.promise).mockResolvedValueOnce(ok(response("sql", "SQL result"))).mockResolvedValueOnce(ok(response("java", "Fresh Java result")));
    const search = field(); search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    search.change("sql");
    await vi.advanceTimersByTimeAsync(200);
    search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    old.resolve(ok(response("java", "Stale Java result")));
    await vi.advanceTimersByTimeAsync(0);
    expect(search.html()).toContain("Fresh Java result");
    search.change("sql"); search.change("java");
    expect(search.html()).toContain("Fresh Java result");
    expect(search.html()).not.toContain("Stale Java result");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("cancels pending debounce work and hides failures when the query is cleared", async () => {
    const search = field(); search.change("java"); search.change("");
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(search.html()).not.toContain('role="listbox"');
    expect(search.html()).not.toContain('role="alert"');
  });

  it("ignores an intentional abort rather than announcing a request failure", async () => {
    fetchMock.mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));
    const search = field(); search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    expect(search.html()).not.toContain('role="alert"');
    expect(search.html()).not.toContain("No matches");
  });
});

describe("search count contrast", () => {
  it("uses opaque existing theme text with at least 4.5:1 contrast in both themes", async () => {
    fetchMock.mockResolvedValue(ok(response("java", "Original lesson")));
    const search = field(); search.change("java");
    await vi.advanceTimersByTimeAsync(200);
    expect(search.html()).toContain('class="font-normal normal-case tracking-normal text-ink-faint">3</span>');
    const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
    const rgb = (block: string, token: string) => block.match(new RegExp(`--${token}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`))!.slice(1).map(Number);
    const luminance = (color: number[]) => color.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    for (const selector of [":root", ".dark"]) {
      const block = css.split(`${selector} {`)[1].split("}")[0];
      const values = [luminance(rgb(block, "ink-faint")), luminance(rgb(block, "card"))].sort((a, b) => a - b);
      expect((values[1] + 0.05) / (values[0] + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

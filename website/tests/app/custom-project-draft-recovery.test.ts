import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyDraft } from "@/lib/customProjects";

// Hook runner using the existing Node test environment; dependencies remain real
// except React scheduling and the external Supabase boundary.
const hooks = vi.hoisted(() => ({ slots: [] as unknown[], index: 0, effects: [] as (() => void)[], cleanups: [] as (() => void)[] }));
const api = vi.hoisted(() => ({ getUser: vi.fn(), read: vi.fn(), upsert: vi.fn(), eq: vi.fn(), toast: vi.fn() }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [hooks.slots[index], (value: unknown) => { hooks.slots[index] = typeof value === "function" ? value(hooks.slots[index]) : value; }];
  },
  useRef: (value: unknown) => {
    const index = hooks.index++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: value };
    return hooks.slots[index];
  },
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => (() => void) | undefined, deps: unknown[]) => {
    const index = hooks.index++;
    const previous = hooks.slots[index] as unknown[] | undefined;
    if (previous && deps.every((dep, i) => Object.is(dep, previous[i]))) return;
    hooks.slots[index] = deps;
    hooks.effects.push(() => {
      hooks.cleanups[index]?.();
      hooks.cleanups[index] = effect() ?? (() => {});
    });
  },
}));
vi.mock("@/components/ui/Toast", () => ({ toast: api.toast }));
vi.mock("@/lib/supabase/browser", () => ({ createBrowserSupabase: () => ({
  auth: { getUser: api.getUser },
  from: () => {
    const query = { select: () => query, eq: (...args: unknown[]) => { api.eq(...args); return query; }, abortSignal: () => query, maybeSingle: api.read, upsert: api.upsert };
    return query;
  },
}) }));
import { useDraft } from "@/app/custom-projects/_builder/useDraft";

function RenderDraft() {
  hooks.index = 0;
  const result = useDraft();
  hooks.effects.splice(0).forEach(effect => effect());
  return result;
}
async function settle() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
const saved = { ...emptyDraft(), title: "Saved fixture", objective: "Keep my text" };

beforeEach(() => {
  hooks.slots = []; hooks.effects = []; hooks.cleanups = [];
  api.getUser.mockReset().mockResolvedValue({ data: { user: { id: "fixture-owner" } }, error: null });
  api.read.mockReset().mockResolvedValue({ data: { payload: saved }, error: null });
  api.upsert.mockReset().mockResolvedValue({ error: null });
  api.eq.mockReset(); api.toast.mockReset();
});
afterEach(() => { hooks.cleanups.forEach(cleanup => cleanup?.()); vi.useRealTimers(); });

describe("draft recovery and entered data", () => {
  it("retries a failed read in place without saving an empty draft", async () => {
    api.read.mockResolvedValueOnce({ data: null, error: { code: "08006" } });
    RenderDraft(); await settle();
    const failed = RenderDraft();
    expect(failed.loaded).toBe(false);
    expect(failed.loadError?.kind).toBe("transient");
    expect(api.upsert).not.toHaveBeenCalled();
    failed.retryLoad(); RenderDraft(); await settle();
    const recovered = RenderDraft();
    expect(recovered.loaded).toBe(true);
    expect(recovered.loadError).toBeNull();
    expect(recovered.draft.title).toBe(saved.title);
    expect(api.read).toHaveBeenCalledTimes(2);
    expect(api.eq).toHaveBeenCalledWith("user_id", "fixture-owner");
    expect(api.upsert).not.toHaveBeenCalled();
  });
  it("distinguishes missing drafts from read errors", async () => {
    api.read.mockResolvedValue({ data: null, error: null });
    RenderDraft(); await settle();
    const result = RenderDraft();
    expect(result.loaded).toBe(true);
    expect(result.loadError).toBeNull();
    expect(result.draft).toEqual(emptyDraft());
  });
  it.each(["missing-session", "permission-denied"])("does not unlock the form on %s", async mode => {
    if (mode === "missing-session") api.getUser.mockResolvedValue({ data: { user: null }, error: null });
    else api.read.mockResolvedValue({ data: null, error: { code: "42501" } });
    RenderDraft(); await settle();
    const result = RenderDraft();
    expect(result.loadError?.kind).toBe("unauthorized");
    expect(result.loaded).toBe(false);
    await expect(result.saveNow()).rejects.toMatchObject({ kind: "unauthorized" });
    expect(api.upsert).not.toHaveBeenCalled();
  });
  it("keeps entered fields, selections and files after failed saves and retries the same data", async () => {
    RenderDraft(); await settle();
    let result = RenderDraft();
    result.patch({ title: "Entered locally", objective: "Do not lose this", featureIds: ["fixture-feature"], referenceFiles: [{ path: "fixture/notes.pdf", name: "notes.pdf", sizeMb: 1 }] });
    result = RenderDraft();
    api.upsert.mockResolvedValueOnce({ error: { code: "08006", message: "Offline" } });
    await expect(result.saveNow()).rejects.toThrow("Offline");
    result = RenderDraft();
    expect(result.loaded).toBe(true);
    expect(result.draft).toMatchObject({ title: "Entered locally", objective: "Do not lose this", featureIds: ["fixture-feature"] });
    await result.saveNow();
    expect(api.upsert.mock.calls[1][0]).toEqual(api.upsert.mock.calls[0][0]);
    expect(api.read).toHaveBeenCalledTimes(1);
  });
  it("preserves entered data during an autosave failure without triggering a reload", async () => {
    vi.useFakeTimers();
    RenderDraft(); await settle();
    RenderDraft().patch({ title: "Unsaved fixture" }); RenderDraft();
    api.upsert.mockResolvedValueOnce({ error: { message: "Offline" } });
    await vi.advanceTimersByTimeAsync(700);
    expect(RenderDraft().draft.title).toBe("Unsaved fixture");
    expect(api.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Could not save" }));
    expect(api.read).toHaveBeenCalledTimes(1);
  });
  it("recovers from a network timeout without replacing the saved draft", async () => {
    vi.useFakeTimers();
    api.read.mockImplementationOnce(() => new Promise(() => {}));
    RenderDraft(); await settle();
    await vi.advanceTimersByTimeAsync(10_000);
    const failed = RenderDraft();
    expect(failed.loadError?.kind).toBe("transient");
    failed.retryLoad(); RenderDraft(); await settle();
    expect(RenderDraft().draft.title).toBe(saved.title);
    expect(api.upsert).not.toHaveBeenCalled();
  });
});

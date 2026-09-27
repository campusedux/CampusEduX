import { describe, it, expect, vi } from "vitest";
import { whenNearViewport } from "@/lib/useNearViewport";

/**
 * `whenNearViewport` gates the deferred mount of the coding-problem code
 * editor. Contract: fire once when the element first intersects, never before,
 * never twice, not after cleanup — and fire immediately when the browser has
 * no IntersectionObserver (deferral must never withhold the editor).
 */

type Entry = { isIntersecting: boolean };

function makeFakeIO() {
  const instances: FakeIO[] = [];
  class FakeIO {
    callback: (entries: Entry[]) => void;
    options: { rootMargin?: string } | undefined;
    observed: Element[] = [];
    disconnected = false;
    constructor(cb: (entries: Entry[]) => void, options?: { rootMargin?: string }) {
      this.callback = cb;
      this.options = options;
      instances.push(this);
    }
    observe(el: Element) {
      this.observed.push(el);
    }
    disconnect() {
      this.disconnected = true;
    }
    emit(entries: Entry[]) {
      this.callback(entries);
    }
  }
  return { FakeIO, instances };
}

const el = {} as Element;

describe("whenNearViewport", () => {
  it("fires immediately when IntersectionObserver is unavailable", () => {
    const onVisible = vi.fn();
    // Node has no IntersectionObserver, so the default resolves to undefined.
    const cleanup = whenNearViewport(el, onVisible);
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(() => cleanup()).not.toThrow();
  });

  it("observes the element with the given rootMargin and waits for an intersection", () => {
    const { FakeIO, instances } = makeFakeIO();
    const onVisible = vi.fn();
    whenNearViewport(el, onVisible, { rootMargin: "300px", IO: FakeIO as unknown as typeof IntersectionObserver });
    expect(instances).toHaveLength(1);
    expect(instances[0].observed).toEqual([el]);
    expect(instances[0].options).toEqual({ rootMargin: "300px" });
    expect(onVisible).not.toHaveBeenCalled();

    instances[0].emit([{ isIntersecting: false }]);
    expect(onVisible).not.toHaveBeenCalled();
    expect(instances[0].disconnected).toBe(false);
  });

  it("fires once on the first intersection and disconnects", () => {
    const { FakeIO, instances } = makeFakeIO();
    const onVisible = vi.fn();
    whenNearViewport(el, onVisible, { IO: FakeIO as unknown as typeof IntersectionObserver });
    instances[0].emit([{ isIntersecting: true }]);
    instances[0].emit([{ isIntersecting: true }]);
    expect(onVisible).toHaveBeenCalledTimes(1);
    expect(instances[0].disconnected).toBe(true);
  });

  it("defaults rootMargin to 200px", () => {
    const { FakeIO, instances } = makeFakeIO();
    whenNearViewport(el, vi.fn(), { IO: FakeIO as unknown as typeof IntersectionObserver });
    expect(instances[0].options).toEqual({ rootMargin: "200px" });
  });

  it("never fires after cleanup", () => {
    const { FakeIO, instances } = makeFakeIO();
    const onVisible = vi.fn();
    const cleanup = whenNearViewport(el, onVisible, { IO: FakeIO as unknown as typeof IntersectionObserver });
    cleanup();
    expect(instances[0].disconnected).toBe(true);
    instances[0].emit([{ isIntersecting: true }]);
    expect(onVisible).not.toHaveBeenCalled();
  });
});

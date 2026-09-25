import type { StateStorage } from "zustand/middleware";
import { createProgressStore, PROGRESS_STORAGE_KEY } from "@/learning/progress/progressStoreCore";

const memoryStorage = (initial: Record<string, string> = {}): StateStorage & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
};

/** A device with a switchable signed-in user. */
function device(initial?: Record<string, string>) {
  let uid: string | undefined;
  const storage = memoryStorage(initial);
  const store = createProgressStore({ getUserId: () => uid, storage });
  return {
    store,
    storage,
    login: (id?: string) => {
      uid = id;
    },
    s: () => store.getState(),
  };
}

const NOW = new Date(2026, 8, 19, 12);
const yesterday = new Date(2026, 8, 18, 12);

describe("progress is scoped per user", () => {
  it("two users on one device never see each other's progress, streak or Continue card", () => {
    const d = device();

    d.login("user-a");
    d.s().markComplete("java", "intro", yesterday);
    d.s().markComplete("java", "vars", NOW);
    d.s().markOpened({ gridSlug: "java", gridName: "Java", topicSlug: "vars", topicTitle: "Variables" });
    expect(d.s().getCompletedCount("java")).toBe(2);
    expect(d.s().getStreak(NOW)).toBe(2);
    expect(d.s().getLastOpened()?.topicSlug).toBe("vars");

    d.login("user-b"); // account switch
    expect(d.s().getCompletedCount("java")).toBe(0);
    expect(d.s().isCompleted("java", "intro")).toBe(false);
    expect(d.s().getStreak(NOW)).toBe(0);
    expect(d.s().getLastOpened()).toBeNull();

    d.s().markComplete("python", "hello", NOW);
    expect(d.s().getCompletedCount("python")).toBe(1);
    expect(d.s().getStreak(NOW)).toBe(1);

    d.login("user-a"); // A comes back: untouched by B
    expect(d.s().getCompletedCount("python")).toBe(0);
    expect(d.s().getCompletedCount("java")).toBe(2);
    expect(d.s().getStreak(NOW)).toBe(2);
    expect(d.s().getLastOpened()?.gridSlug).toBe("java");
  });

  it("a switch mid-session redirects writes to the new user's bucket only", () => {
    const d = device();
    d.login("a");
    d.s().recordReadingActivity(NOW);
    d.login("b");
    d.s().markOpened({ gridSlug: "g", gridName: "G", topicSlug: "t", topicTitle: "T" });
    expect(Object.keys(d.s().users).sort()).toEqual(["a", "b"]);
    expect(d.s().users.a.lastOpened).toBeNull();
    expect(d.s().users.b.activeDays).toEqual([]);
  });

  it("signed out: reads are empty and NOTHING is recorded", () => {
    const d = device();
    d.login(undefined);
    d.s().markComplete("java", "intro", NOW);
    d.s().markOpened({ gridSlug: "java", gridName: "Java", topicSlug: "intro", topicTitle: "Intro" });
    d.s().recordReadingActivity(NOW);
    d.s().setScroll("java", "intro", 500);
    d.s().setReaderFontSize("large");
    expect(d.s().users).toEqual({});
    expect(d.s().getCompletedCount("java")).toBe(0);
    expect(d.s().getLastOpened()).toBeNull();
    expect(d.s().getStreak(NOW)).toBe(0);
    expect(d.s().getReaderFontSize()).toBe("medium");
  });

  it("logging out hides the previous user's data (and login brings it back)", () => {
    const d = device();
    d.login("a");
    d.s().markComplete("java", "intro", NOW);
    d.login(undefined);
    expect(d.s().getCompletedCount("java")).toBe(0);
    expect(d.s().getLastOpened()).toBeNull();
    d.login("a");
    expect(d.s().getCompletedCount("java")).toBe(1);
  });

  it("scroll + font size are per user", () => {
    const d = device();
    d.login("a");
    d.s().setScroll("java", "intro", 812.6);
    d.s().setReaderFontSize("large");
    d.login("b");
    expect(d.s().getScroll("java", "intro")).toBe(0);
    expect(d.s().getReaderFontSize()).toBe("medium");
    d.login("a");
    expect(d.s().getScroll("java", "intro")).toBe(813);
    expect(d.s().getReaderFontSize()).toBe("large");
  });

  it("unmarkComplete only affects the current user", () => {
    const d = device();
    d.login("a");
    d.s().markComplete("java", "intro", NOW);
    d.login("b");
    d.s().markComplete("java", "intro", NOW);
    d.s().unmarkComplete("java", "intro");
    expect(d.s().isCompleted("java", "intro")).toBe(false);
    d.login("a");
    expect(d.s().isCompleted("java", "intro")).toBe(true);
  });
});

describe("persistence", () => {
  it("both users' data survives an app restart, still separated", () => {
    const d1 = device();
    d1.login("a");
    d1.s().markComplete("java", "intro", NOW);
    d1.login("b");
    d1.s().markComplete("python", "hello", NOW);

    // "restart": new store instance over the same storage
    const d2 = device(d1.storage.data);
    d2.login("a");
    expect(d2.s().getCompletedCount("java")).toBe(1);
    expect(d2.s().getCompletedCount("python")).toBe(0);
    d2.login("b");
    expect(d2.s().getCompletedCount("python")).toBe(1);
    expect(d2.s().getCompletedCount("java")).toBe(0);
  });

  it("legacy unscoped (v1, device-wide) data is ignored, never shown to anyone", () => {
    const legacy = JSON.stringify({
      state: { completed: { "java/intro": "2026-09-01T00:00:00.000Z" }, lastOpened: { gridSlug: "java" }, activeDays: ["2026-09-18", "2026-09-19"], scroll: {}, readerFontSize: "large" },
      version: 1,
    });
    const d = device({ [PROGRESS_STORAGE_KEY]: legacy });
    d.login("a");
    expect(d.s().getCompletedCount("java")).toBe(0);
    expect(d.s().getLastOpened()).toBeNull();
    expect(d.s().getStreak(NOW)).toBe(0);
    expect(d.s().users).toEqual({});
  });
});

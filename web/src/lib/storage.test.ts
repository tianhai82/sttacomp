// web/src/lib/storage.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { save, load, loadAll, remove, loadMostRecent } from "./storage";
import type { DrawPrepState } from "./types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

function makeState(overrides?: Partial<DrawPrepState>): DrawPrepState {
  return {
    id: "test-1",
    createdAt: Date.now(),
    numGroups: 4,
    groups: [],
    round: 8,
    baseWinnerPositions: [1, 8, 4, 5],
    baseRunnerUpPositions: [3, 6],
    baseByePositions: [2, 7],
    ...overrides,
  };
}

describe("storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("save and load round-trip", () => {
    it("saves and loads a state by id", () => {
      const state = makeState();
      save(state);
      const loaded = load("test-1");
      expect(loaded).toEqual(state);
    });
  });

  describe("load returns null for missing id", () => {
    it("returns null when id does not exist", () => {
      expect(load("nonexistent")).toBeNull();
    });
  });

  describe("expired entries are purged on loadAll", () => {
    it("purges entries older than 7 days", () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const fresh = makeState({ id: "fresh", createdAt: Date.now() });
      const expired = makeState({
        id: "expired",
        createdAt: Date.now() - sevenDaysMs - 1,
      });

      save(fresh);
      save(expired);

      const all = loadAll();
      expect(all["fresh"]).toBeDefined();
      expect(all["expired"]).toBeUndefined();
    });

    it("keeps entries exactly at 7 days", () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const borderline = makeState({
        id: "borderline",
        createdAt: Date.now() - sevenDaysMs,
      });

      save(borderline);

      const all = loadAll();
      expect(all["borderline"]).toBeDefined();
    });
  });

  describe("remove deletes entry", () => {
    it("removes a saved entry", () => {
      const state = makeState();
      save(state);
      expect(load("test-1")).not.toBeNull();

      remove("test-1");
      expect(load("test-1")).toBeNull();
    });
  });

  describe("load returns null for expired entry", () => {
    it("returns null for an expired entry loaded directly", () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const expired = makeState({
        id: "expired-direct",
        createdAt: Date.now() - sevenDaysMs - 1,
      });

      save(expired);
      expect(load("expired-direct")).toBeNull();
    });
  });

  describe("loadMostRecent", () => {
    it("returns the entry with the latest createdAt", () => {
      const old = makeState({ id: "old", createdAt: Date.now() - 1000 });
      const newer = makeState({ id: "newer", createdAt: Date.now() - 500 });
      const newest = makeState({ id: "newest", createdAt: Date.now() });
      save(old);
      save(newer);
      save(newest);

      const result = loadMostRecent();
      expect(result!.id).toBe("newest");
    });

    it("returns null when store is empty", () => {
      expect(loadMostRecent()).toBeNull();
    });

    it("skips expired entries", () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const fresh = makeState({ id: "fresh", createdAt: Date.now() });
      const expired = makeState({ id: "expired", createdAt: Date.now() - sevenDaysMs - 1 });
      save(fresh);
      save(expired);

      const result = loadMostRecent();
      expect(result!.id).toBe("fresh");
    });
  });
});

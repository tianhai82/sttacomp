import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveImport } from "./importDraw";
import type { DrawPrepState } from "./types";

// Mock storage
vi.mock("./storage", () => ({
  save: vi.fn(),
  listAll: vi.fn(() => []),
}));

import { save, listAll } from "./storage";

function makeValidFileData(overrides?: Record<string, unknown>) {
  return {
    numGroups: 2,
    groups: [
      { winner: { na: "A", name: "Player A", position: 1 }, hasRunnerUp: true, runnerUp: { na: "B", name: "Player B", position: 4 } },
      { winner: { na: "C", name: "Player C", position: 3 }, hasRunnerUp: true, runnerUp: { na: "D", name: "Player D", position: 2 } },
    ],
    eventName: "Test Event",
    ...overrides,
  };
}

const mockDrawData = {
  round: 4,
  baseWinnerPositions: [1, 4],
  baseRunnerUpPositions: [2, 3],
  baseByePositions: [],
};

const mockComputeDrawData = vi.fn(() => Promise.resolve(mockDrawData));

function mockBuildState(numGroups: number, groups: any[], drawData: any, eventName: string): DrawPrepState {
  return {
    id: "new-id",
    createdAt: Date.now(),
    numGroups,
    groups,
    eventName,
    ...drawData,
  };
}

function makeFile(data: Record<string, unknown>): File {
  return new File([JSON.stringify(data)], "test.json", { type: "application/json" });
}

describe("resolveImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("prompt", vi.fn(() => null));
    vi.stubGlobal("alert", vi.fn());
  });

  it("imports a valid file with no collision", async () => {
    vi.mocked(listAll).mockReturnValue([]);
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result).not.toBeNull();
    expect(result!.state.eventName).toBe("Test Event");
    expect(result!.replaced).toBe(false);
    expect(save).toHaveBeenCalled();
  });

  it("throws on invalid file missing numGroups", async () => {
    await expect(resolveImport(makeFile({ groups: [] }), mockComputeDrawData, mockBuildState)).rejects.toThrow("Invalid file");
  });

  it("throws on numGroups/groups length mismatch", async () => {
    await expect(
      resolveImport(makeFile(makeValidFileData({ numGroups: 5 })), mockComputeDrawData, mockBuildState)
    ).rejects.toThrow("does not match");
  });

  it("throws on group missing winner", async () => {
    const data = makeValidFileData();
    data.groups[0] = { hasRunnerUp: true };
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("missing winner");
  });

  it("throws on invalid runner-up fields", async () => {
    const data = makeValidFileData();
    data.groups[0].runnerUp = { na: 123, name: "ok" };
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("invalid fields");
  });

  it("throws on winner position out of range", async () => {
    const data = makeValidFileData();
    data.groups[0].winner.position = 999;
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("out of range");
  });

  it("throws on runner-up position out of range", async () => {
    const data = makeValidFileData();
    data.groups[0].runnerUp.position = 999;
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("out of range");
  });

  it("replaces existing draw when user confirms", async () => {
    vi.mocked(listAll).mockReturnValue([{ id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() }]);
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result!.replaced).toBe(true);
    expect(result!.state.id).toBe("existing-1");
  });

  it("imports with new name when user chooses rename", async () => {
    vi.mocked(listAll).mockReturnValue([{ id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() }]);
    vi.stubGlobal("confirm", vi.fn(() => false)); // choose rename
    vi.stubGlobal("prompt", vi.fn(() => "Renamed Event"));

    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result!.replaced).toBe(false);
    expect(result!.state.eventName).toBe("Renamed Event");
    expect(result!.state.id).toBe("new-id"); // new ID, not existing
  });

  it("re-prompts when renamed name also collides", async () => {
    vi.mocked(listAll).mockReturnValue([
      { id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() },
      { id: "existing-2", eventName: "Colliding Name", numGroups: 2, createdAt: Date.now() },
    ]);
    vi.stubGlobal("confirm", vi.fn(() => false)); // choose rename
    let promptCallCount = 0;
    vi.stubGlobal("prompt", vi.fn(() => {
      promptCallCount++;
      if (promptCallCount === 1) return "Colliding Name"; // first attempt collides
      return null; // second attempt: cancel
    }));
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result).toBeNull(); // user cancelled after failed rename
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("also exists"));
  });

  it("returns null when user cancels the whole import", async () => {
    vi.mocked(listAll).mockReturnValue([{ id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() }]);
    vi.stubGlobal("confirm", vi.fn(() => false)); // choose rename
    vi.stubGlobal("prompt", vi.fn(() => null)); // cancel prompt
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result).toBeNull();
  });

  it("defaults eventName to empty string when not in file", async () => {
    vi.mocked(listAll).mockReturnValue([]);
    const data = makeValidFileData();
    delete data.eventName;
    const result = await resolveImport(makeFile(data), mockComputeDrawData, mockBuildState);
    expect(result!.state.eventName).toBe("");
  });
});

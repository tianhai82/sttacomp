// web/src/lib/positions.test.ts
import { describe, it, expect } from "vitest";
import {
  deriveActivePositions,
  getOccupiedPositions,
  getAvailablePositions,
  isInOppositeHalf,
} from "./positions";
import type { Group, DrawPrepState } from "./types";

function makeGroup(overrides?: Partial<Group>): Group {
  return {
    winner: { na: "", name: "", position: null },
    hasRunnerUp: true,
    runnerUp: null,
    ...overrides,
  };
}

function makeState(groups: Group[], round = 8): DrawPrepState {
  return {
    id: "test",
    createdAt: Date.now(),
    numGroups: groups.length,
    groups,
    round,
    baseWinnerPositions: [1, 8, 4, 5],
    baseRunnerUpPositions: [3, 6],
    baseByePositions: [2, 7],
  };
}

describe("deriveActivePositions", () => {
  it("returns base positions when no groups are missing runner-ups", () => {
    const groups = [
      makeGroup(),
      makeGroup(),
      makeGroup(),
      makeGroup(),
    ];
    const state = makeState(groups);

    const result = deriveActivePositions(state);

    expect(result.winners).toEqual([1, 8, 4, 5]);
    expect(result.runnerups).toEqual([3, 6]);
    expect(result.byes).toEqual([2, 7]);
  });

  it("removes highest runner-up from opposite half when one group has no runner-up, winner in bottom half", () => {
    // round=8, top half = 1-4, bottom half = 5-8
    // Winner at position 5 (bottom half) → remove from top half runner-ups
    // baseRunnerUpPositions = [3, 6]; top half runner-ups = [3]
    // Remove highest in top half = 3
    const groups = [
      makeGroup({ winner: { na: "", name: "", position: 5 }, hasRunnerUp: false }),
      makeGroup(),
      makeGroup(),
      makeGroup(),
    ];
    const state = makeState(groups);

    const result = deriveActivePositions(state);

    expect(result.runnerups).toEqual([6]);
    expect(result.byes).toEqual([2, 7, 3]);
    expect(result.winners).toEqual([1, 8, 4, 5]);
  });

  it("removes highest runner-up from opposite half when one group has no runner-up, winner in top half", () => {
    // Winner at position 1 (top half) → remove from bottom half runner-ups
    // baseRunnerUpPositions = [3, 6]; bottom half runner-ups = [6]
    // Remove highest in bottom half = 6
    const groups = [
      makeGroup({ winner: { na: "", name: "", position: 1 }, hasRunnerUp: false }),
      makeGroup(),
      makeGroup(),
      makeGroup(),
    ];
    const state = makeState(groups);

    const result = deriveActivePositions(state);

    expect(result.runnerups).toEqual([3]);
    expect(result.byes).toEqual([2, 7, 6]);
    expect(result.winners).toEqual([1, 8, 4, 5]);
  });

  it("removes two runner-ups from opposite half when two groups without runner-ups have winners in same half", () => {
    // Both winners in bottom half → remove two from top half runner-ups
    // baseRunnerUpPositions = [3, 6]; top half = [3]
    // Only 1 top half runner-up, so only 1 can be removed
    const groups = [
      makeGroup({ winner: { na: "", name: "", position: 5 }, hasRunnerUp: false }),
      makeGroup({ winner: { na: "", name: "", position: 8 }, hasRunnerUp: false }),
      makeGroup(),
      makeGroup(),
    ];
    const state = makeState(groups);

    const result = deriveActivePositions(state);

    expect(result.runnerups).toEqual([6]);
    expect(result.byes).toContain(3);
    expect(result.byes.length).toBe(3);
  });

  it("removes one from each half when two groups without runner-ups have winners in different halves", () => {
    // Winner at 1 (top half) → remove from bottom half: [6] → remove 6
    // Winner at 8 (bottom half) → remove from top half: [3] → remove 3
    const groups = [
      makeGroup({ winner: { na: "", name: "", position: 1 }, hasRunnerUp: false }),
      makeGroup({ winner: { na: "", name: "", position: 8 }, hasRunnerUp: false }),
      makeGroup(),
      makeGroup(),
    ];
    const state = makeState(groups);

    const result = deriveActivePositions(state);

    expect(result.runnerups).toEqual([]);
    expect(result.byes).toContain(3);
    expect(result.byes).toContain(6);
    expect(result.byes.length).toBe(4); // 2 base + 2 removed
  });

  it("ignores groups without runner-up if winner position is null", () => {
    const groups = [
      makeGroup({ hasRunnerUp: false }), // winner position null
      makeGroup(),
      makeGroup(),
      makeGroup(),
    ];
    const state = makeState(groups);

    const result = deriveActivePositions(state);

    // No removal because winner not placed
    expect(result.runnerups).toEqual([3, 6]);
    expect(result.byes).toEqual([2, 7]);
  });
});

describe("getOccupiedPositions", () => {
  it("returns set of all non-null positions", () => {
    const groups = [
      makeGroup({ winner: { na: "", name: "A", position: 1 } }),
      makeGroup({
        winner: { na: "", name: "B", position: 8 },
        runnerUp: { na: "", name: "C", position: 3 },
      }),
      makeGroup({ winner: { na: "", name: "D", position: null } }),
    ];

    const occupied = getOccupiedPositions(groups);

    expect(occupied).toEqual(new Set([1, 8, 3]));
  });

  it("returns empty set when no positions are assigned", () => {
    const groups = [makeGroup(), makeGroup()];
    const occupied = getOccupiedPositions(groups);
    expect(occupied).toEqual(new Set());
  });
});

describe("getAvailablePositions", () => {
  it("filters active positions against occupied set", () => {
    const active = [1, 3, 5, 7];
    const occupied = new Set([3, 5]);
    const available = getAvailablePositions(active, occupied);
    expect(available).toEqual([1, 7]);
  });

  it("returns all positions when none occupied", () => {
    const active = [1, 3, 5, 7];
    const occupied = new Set();
    const available = getAvailablePositions(active, occupied);
    expect(available).toEqual([1, 3, 5, 7]);
  });
});

describe("isInOppositeHalf", () => {
  it("returns true for top half when winner is in bottom half", () => {
    expect(isInOppositeHalf(1, 5, 8)).toBe(true);  // pos 1 top, winner 5 bottom
  });

  it("returns true for bottom half when winner is in top half", () => {
    expect(isInOppositeHalf(6, 2, 8)).toBe(true);  // pos 6 bottom, winner 2 top
  });

  it("returns false for same half", () => {
    expect(isInOppositeHalf(1, 3, 8)).toBe(false); // both top
    expect(isInOppositeHalf(5, 7, 8)).toBe(false); // both bottom
  });

  it("works for round 4", () => {
    expect(isInOppositeHalf(1, 3, 4)).toBe(true);  // top vs bottom
    expect(isInOppositeHalf(1, 2, 4)).toBe(false); // both top
  });
});

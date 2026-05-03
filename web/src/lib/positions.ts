// web/src/lib/positions.ts
import type { Group, DrawPrepState } from "./types";

export interface ActivePositions {
  winners: number[];
  runnerups: number[];
  byes: number[];
}

/**
 * Derives active (effective) positions from a DrawPrepState.
 *
 * For each group where hasRunnerUp === false AND winner.position !== null,
 * the highest-index runner-up in the opposite half is removed from runner-ups
 * and added to byes. Groups are processed in order.
 */
export function deriveActivePositions(state: DrawPrepState): ActivePositions {
  const runnerups = [...state.baseRunnerUpPositions];
  const byes = [...state.baseByePositions];
  const removed = new Set<number>();

  for (const group of state.groups) {
    if (group.hasRunnerUp || group.winner.position === null) continue;

    const winnerPos = group.winner.position;

    // Find runner-up candidates in the opposite half, excluding already removed
    const candidates = runnerups.filter(
      (p) => !removed.has(p) && isInOppositeHalf(p, winnerPos, state.round)
    );

    if (candidates.length === 0) continue;

    // Remove the highest-index candidate
    const toRemove = candidates[candidates.length - 1];
    removed.add(toRemove);
    byes.push(toRemove);
  }

  return {
    winners: [...state.baseWinnerPositions],
    runnerups: runnerups.filter((p) => !removed.has(p)),
    byes,
  };
}

/** Collects all non-null positions from groups (winner and runner-up). */
export function getOccupiedPositions(groups: Group[]): Set<number> {
  const occupied = new Set<number>();
  for (const group of groups) {
    if (group.winner.position !== null) {
      occupied.add(group.winner.position);
    }
    if (group.runnerUp?.position !== null && group.runnerUp?.position !== undefined) {
      occupied.add(group.runnerUp.position);
    }
  }
  return occupied;
}

/** Filters active positions to only those not in the occupied set. */
export function getAvailablePositions(
  active: number[],
  occupied: Set<number>
): number[] {
  return active.filter((p) => !occupied.has(p));
}

/**
 * Returns true if `pos` is in the opposite half of `winnerPos`
 * for a draw of the given round size.
 *
 * Top half: 1..round/2, Bottom half: round/2+1..round
 */
export function isInOppositeHalf(
  pos: number,
  winnerPos: number,
  round: number
): boolean {
  const half = round / 2;
  const posInTop = pos <= half;
  const winnerInTop = winnerPos <= half;
  return posInTop !== winnerInTop;
}

/**
 * Finds group indices where runner-up positions are no longer valid.
 *
 * A runner-up position is invalid if:
 * 1. It's no longer in the active runner-up positions (slot was reclassified), OR
 * 2. It's no longer in the opposite half of the group's winner position
 */
export function findInvalidRunnerUpIndices(
  groups: Group[],
  activePositions: ActivePositions,
  round: number
): number[] {
  const activeRunnerUpSet = new Set(activePositions.runnerups);
  const invalid: number[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group.winner.position === null || !group.runnerUp || group.runnerUp.position === null) continue;

    const runnerUpPos = group.runnerUp.position;
    const winnerPos = group.winner.position;

    // Check: is the runner-up slot still active?
    if (!activeRunnerUpSet.has(runnerUpPos)) {
      invalid.push(i);
      continue;
    }

    // Check: is the runner-up still in the opposite half?
    if (!isInOppositeHalf(runnerUpPos, winnerPos, round)) {
      invalid.push(i);
    }
  }

  return invalid;
}

/**
 * Clears invalid runner-up positions, returning updated groups and cleared indices.
 * Preserves runner-up name and NA — only the position is nulled.
 */
export function clearInvalidRunnerUps(
  groups: Group[],
  activePositions: ActivePositions,
  round: number
): { groups: Group[]; cleared: number[] } {
  const cleared = findInvalidRunnerUpIndices(groups, activePositions, round);
  if (cleared.length === 0) return { groups, cleared: [] };

  const clearedSet = new Set(cleared);
  const updated = groups.map((g, i) => {
    if (!clearedSet.has(i) || !g.runnerUp) return g;
    return { ...g, runnerUp: { ...g.runnerUp, position: null } };
  });

  return { groups: updated, cleared };
}

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

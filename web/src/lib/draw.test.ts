// web/src/lib/draw.test.ts
import { describe, it, expect } from "vitest";
import {
  calcRound,
  getSeedingOrder,
  getByes,
  getWinnersRunnerupsAndByes,
} from "./draw";

interface Req {
  winner: number;
  runnerup: number;
}

interface Resp {
  winners: number[];
  runnerups: number[];
  byes: number[];
}

const expected: [Req, Resp][] = [
  [{ winner: 2, runnerup: 1 }, { winners: [1, 4], runnerups: [3], byes: [2] }],
  [{ winner: 2, runnerup: 2 }, { winners: [1, 4], runnerups: [2, 3], byes: [] }],
  [{ winner: 3, runnerup: 2 }, { winners: [1, 5, 8], runnerups: [3, 4], byes: [2, 6, 7] }],
  [{ winner: 3, runnerup: 3 }, { winners: [1, 5, 8], runnerups: [3, 4, 6], byes: [2, 7] }],
  [{ winner: 4, runnerup: 3 }, { winners: [1, 8, 5, 4], runnerups: [3, 7, 6], byes: [2] }],
  [{ winner: 4, runnerup: 4 }, { winners: [1, 8, 5, 4], runnerups: [2, 3, 7, 6], byes: [] }],
  [{ winner: 5, runnerup: 4 }, { winners: [1, 8, 9, 12, 16], runnerups: [4, 5, 6, 13], byes: [2, 3, 7, 10, 11, 14, 15] }],
  [{ winner: 5, runnerup: 5 }, { winners: [1, 8, 9, 12, 16], runnerups: [4, 5, 6, 13, 14], byes: [2, 3, 7, 10, 11, 15] }],
  [{ winner: 6, runnerup: 5 }, { winners: [1, 5, 8, 9, 12, 16], runnerups: [3, 4, 6, 13, 14], byes: [2, 7, 10, 11, 15] }],
  [{ winner: 6, runnerup: 6 }, { winners: [1, 5, 8, 9, 12, 16], runnerups: [3, 4, 6, 11, 13, 14], byes: [2, 7, 10, 15] }],
  [{ winner: 7, runnerup: 6 }, { winners: [1, 5, 8, 9, 12, 13, 16], runnerups: [3, 4, 6, 10, 11, 14], byes: [2, 7, 15] }],
  [{ winner: 7, runnerup: 7 }, { winners: [1, 5, 8, 9, 12, 13, 16], runnerups: [3, 4, 6, 7, 10, 11, 14], byes: [2, 15] }],
  [{ winner: 8, runnerup: 7 }, { winners: [1, 4, 5, 8, 9, 12, 13, 16], runnerups: [3, 6, 7, 10, 11, 14, 15], byes: [2] }],
  [{ winner: 8, runnerup: 8 }, { winners: [1, 4, 5, 8, 9, 12, 13, 16], runnerups: [2, 3, 6, 7, 10, 11, 14, 15], byes: [] }],
];

function sameInts(a: number[], b: number[]): boolean {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

function testReqCal(req: Req): Resp {
  const rounds = calcRound(req.winner + req.runnerup);
  const byesCount = rounds - req.winner - req.runnerup;
  const pos = Array.from({ length: rounds }, (_, i) => i + 1);
  const seedingOrder = getSeedingOrder(pos);
  const { runnerups, byes } = getWinnersRunnerupsAndByes(
    pos, seedingOrder, req.runnerup, req.winner, byesCount
  );
  return {
    byes,
    runnerups,
    winners: seedingOrder.slice(0, req.winner),
  };
}

function getPos(round: number): number[] {
  return Array.from({ length: round }, (_, i) => i + 1);
}

function isReverse(seeds: number[], byes: number[]): boolean {
  if (seeds.length !== byes.length) return false;
  for (let i = 0; i < seeds.length / 2 - 1; i++) {
    if (seeds[i] !== byes[seeds.length - i - 1]) return false;
  }
  return true;
}

describe("draw", () => {
  describe("calcRound", () => {
    it("throws for <= 2 players", () => {
      expect(() => calcRound(2)).toThrow("Total no. of players must be more than 2");
      expect(() => calcRound(1)).toThrow();
    });

    it("returns 4 for 3-4 players", () => {
      expect(calcRound(3)).toBe(4);
      expect(calcRound(4)).toBe(4);
    });

    it("returns 8 for 5-8 players", () => {
      expect(calcRound(5)).toBe(8);
      expect(calcRound(8)).toBe(8);
    });
  });

  describe("getByes", () => {
    it("passes for rounds 4 through 1024", () => {
      let round = 4;
      while (round <= 1024) {
        const pos = getPos(round);
        const byes = getByes(pos);
        const seeds = getSeedingOrder(pos).slice(round / 2);
        expect(isReverse(seeds, byes)).toBe(true);
        round *= 2;
      }
    });
  });

  describe("full calculation", () => {
    it.each(expected)("winners=%o, runnerup=%o", (req, expectedResp) => {
      const result = testReqCal(req);
      expect(sameInts(result.byes, expectedResp.byes)).toBe(true);
      expect(sameInts(result.winners, expectedResp.winners)).toBe(true);
      expect(sameInts(result.runnerups, expectedResp.runnerups)).toBe(true);
    });
  });
});

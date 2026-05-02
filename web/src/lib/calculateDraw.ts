// web/src/lib/calculateDraw.ts
import { calcRound, getSeedingOrder, getWinnersRunnerupsAndByes } from "./draw";

export interface DrawResult {
  rounds: number;
  winners: number[];
  runnerups: number[];
  byes: number[];
}

export function calculateDraws({ winners, runnerups }: { winners: number; runnerups: number }): Promise<DrawResult> {
  return new Promise((resolve, reject) => {
    try {
      if (winners <= 0) {
        reject(new Error("Invalid input"));
        return;
      }
      if (runnerups < 0) {
        reject(new Error("Invalid input"));
        return;
      }
      if (winners < runnerups) {
        reject(new Error("No of runner ups cannot be more than winners"));
        return;
      }
      const totalPlayers = winners + runnerups;
      const rounds = calcRound(totalPlayers);
      const byesCount = rounds - winners - runnerups;
      const pos = Array.from({ length: rounds }, (_, i) => i + 1);
      const seedingOrder = getSeedingOrder(pos);
      const result = getWinnersRunnerupsAndByes(pos, seedingOrder, runnerups, winners, byesCount);
      resolve({
        rounds,
        winners: result.winners,
        runnerups: result.runnerups,
        byes: result.byes,
      });
    } catch (e) {
      reject(e);
    }
  });
}

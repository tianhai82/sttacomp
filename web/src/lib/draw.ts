// web/src/lib/draw.ts

export function calcRound(players: number): number {
  if (players <= 2) {
    throw new Error("Total no. of players must be more than 2");
  }
  let round = 2;
  while (round < players) {
    round *= 2;
  }
  return round;
}

function removeFromArray(arr: number[], ...values: number[]): number[] {
  const result = [...arr];
  for (const v of values) {
    const idx = result.lastIndexOf(v);
    if (idx !== -1) {
      result.splice(idx, 1);
    }
  }
  return result;
}

function containsInt(arr: number[], a: number): boolean {
  return arr.includes(a);
}

function anyGotBye(pos: number[], byes: number[]): boolean {
  for (const p of pos) {
    const bye = (p % 2 === 0) ? p - 1 : p + 1;
    if (containsInt(byes, bye)) return true;
  }
  return false;
}

function allGotBye(pos: number[], byes: number[]): boolean {
  for (const p of pos) {
    const bye = (p % 2 === 0) ? p - 1 : p + 1;
    if (!containsInt(byes, bye)) return false;
  }
  return true;
}

function smallerOf(a: number, b: number): number {
  return a < b ? a : b;
}

export function getAdjacentPositions(pos: number[], bye: number): number[] {
  if (bye > pos.length) {
    throw new Error("Bye positions more than total number of positions in first round");
  }
  const byes: number[] = [];
  for (let i = 0; i < bye; i++) {
    byes.push((pos[i] % 2 === 0) ? pos[i] - 1 : pos[i] + 1);
  }
  return byes;
}

export function getSeedingOrder(pos: number[]): number[] {
  if (pos.length === 4) {
    return [pos[0], pos[3], pos[2], pos[1]];
  } else if (pos.length === 8) {
    return [pos[0], pos[7], pos[4], pos[3], pos[5], pos[2], pos[6], pos[1]];
  }
  const playerPerQ = pos.length / 4;
  const a: number[][] = [];
  for (let q = 0; q < 4; q++) {
    a[q] = pos.slice(q * playerPerQ, (q + 1) * playerPerQ);
    if (q % 2 !== 0) {
      a[q].reverse();
    }
  }
  const k: number[][] = [];
  for (let i = 0; i < 4; i++) {
    k[i] = getSeedingOrder(a[i]);
  }
  const final: number[] = new Array(pos.length);
  for (let i = 0; i < pos.length / 4; i++) {
    if (i === 0) {
      final[0] = k[0][0];
      final[1] = k[3][0];
      final[2] = k[2][0];
      final[3] = k[1][0];
    } else {
      final[4 * i] = k[2][i];
      final[4 * i + 1] = k[1][i];
      final[4 * i + 2] = k[3][i];
      final[4 * i + 3] = k[0][i];
    }
  }
  return final;
}

export function getByes(pos: number[]): number[] {
  if (pos.length === 4) {
    return [pos[1], pos[2]];
  } else if (pos.length === 8) {
    return [pos[1], pos[6], pos[2], pos[5]];
  }
  const playerPerQ = pos.length / 4;
  const a: number[][] = [];
  for (let q = 0; q < 4; q++) {
    a[q] = pos.slice(q * playerPerQ, (q + 1) * playerPerQ);
    if (q % 2 !== 0) {
      a[q].reverse();
    }
  }
  const k: number[][] = [];
  for (let i = 0; i < 4; i++) {
    k[i] = getByes(a[i]);
  }
  const final: number[] = [];
  for (let i = 0; i < pos.length / 8; i++) {
    final[4 * i] = k[0][i];
    final[4 * i + 1] = k[3][i];
    final[4 * i + 2] = k[1][i];
    final[4 * i + 3] = k[2][i];
  }
  return final;
}

export function getWinnersRunnerupsAndByes(
  pos: number[],
  seedingOrder: number[],
  runnerUpsCount: number,
  winnersCount: number,
  byesCount: number
): { winners: number[]; runnerups: number[]; byes: number[] } {
  let runnerList: number[] = [];
  let winnerList: number[] = [];
  let all = [...seedingOrder];

  if (runnerUpsCount > 0) {
    let byelist = getByes(pos).slice(0, byesCount);
    all = removeFromArray(all, ...seedingOrder.slice(0, winnersCount));
    all = removeFromArray(all, ...byelist);
    runnerList = all.slice(0, runnerUpsCount);
    winnerList = seedingOrder.slice(0, winnersCount);

    if (anyGotBye(runnerList, byelist) && !allGotBye(seedingOrder.slice(0, winnersCount), byelist)) {
      all = [...seedingOrder];
      runnerList = [];
      byelist = getAdjacentPositions(winnerList, smallerOf(winnersCount, byesCount));
      all = removeFromArray(all, ...winnerList);
      all = removeFromArray(all, ...byelist);
      runnerList = all.slice(0, runnerUpsCount);
      all = removeFromArray(all, ...runnerList);
      byelist = [...byelist, ...all];
    }

    return { winners: winnerList, runnerups: runnerList, byes: byelist };
  } else {
    all = removeFromArray(all, ...seedingOrder.slice(0, winnersCount));
    return { winners: seedingOrder.slice(0, winnersCount), runnerups: [], byes: all };
  }
}

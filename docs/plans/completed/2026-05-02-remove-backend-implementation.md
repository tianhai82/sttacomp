# Remove Backend — Implementation Plan

Based on [design doc](2026-05-02-remove-backend-design.md).

## Task 1: Port draw logic to TypeScript with passing tests

<!-- tdd: new-feature -->
<!-- checkpoint: test -->

Create `web/src/lib/draw.ts` — a direct port of `draw/draw.go`:

```ts
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
```

Create `web/src/lib/draw.test.ts` — port of the Go test table:

```ts
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
```

Set up Vitest:

```bash
cd web && npm install -D vitest
```

Add test script to `web/package.json`:

```json
"test": "vitest run"
```

Run tests:

```bash
cd web && npx vitest run
```

All 15 test cases + calcRound + getByes tests should pass.

```bash
git add web/src/lib/draw.ts web/src/lib/draw.test.ts web/package.json web/package-lock.json
git commit -m "feat: port draw logic from Go to TypeScript with Vitest tests"
```

## Task 2: Create calculateDraw wrapper and wire up frontend

<!-- tdd: new-feature -->
<!-- checkpoint: none -->

Create `web/src/lib/calculateDraw.ts`:

```ts
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
```

Update `web/src/pages/Draw.svelte` — change the import:

```js
// replace:
import { calculateDraws } from "../apis/draw";
// with:
import { calculateDraws } from "../lib/calculateDraw";
```

Remove the API proxy from `web/vite.config.js`:

```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
```

Run tests to confirm nothing broke:

```bash
cd web && npx vitest run
```

Verify the app builds:

```bash
cd web && npm run build
```

```bash
git add web/src/lib/calculateDraw.ts web/src/pages/Draw.svelte web/vite.config.js
git commit -m "feat: wire frontend to local draw calculation, remove API proxy"
```

## Task 3: Clean up Firebase config and remove backend files

<!-- tdd: trivial -->
<!-- checkpoint: done -->

Update `firebase.json` — replace the Cloud Run rewrite with a proper SPA rewrite:

```json
{
  "hosting": {
    "public": "web/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Delete backend files:

```bash
rm main.go go.mod go.sum Dockerfile .air.conf
rm -rf api/ draw/
rm web/src/apis/draw.js
```

Remove `wretch` dependency (no longer needed):

```bash
cd web && npm uninstall wretch
```

Update `web/README.md` (or the root `readme.md`) to reflect the simplified setup — remove all Go/Cloud Run references. Or just update `readme.md` at root:

Verify build still works:

```bash
cd web && npm run build
```

```bash
git add -A
git commit -m "chore: remove Go backend, Cloud Run config, and wretch dependency"
```

Now the project deploys as a pure static site — `cd web && npm run build && firebase deploy`.

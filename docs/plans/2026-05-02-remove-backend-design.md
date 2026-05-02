# Remove Backend — Port Draw Logic to Frontend

## Goal

Eliminate the Go/Cloud Run backend entirely. All draw calculation runs client-side in the Svelte app. Deployment becomes a static site on Firebase Hosting (or any static host).

## Why this works

The backend is a single endpoint that does pure computation — no database, no auth, no state, no secrets. The entire `draw` package is ~150 lines of integer array manipulation. Trivial for any browser to run locally.

## Architecture Change

```
BEFORE:  Svelte → HTTP /api/draw/... → Go (Cloud Run) → JSON response → Svelte renders
AFTER:   Svelte → JS function call → result → Svelte renders
```

## Files to Create

### `web/src/lib/draw.ts`

Port of `draw/draw.go`. Pure functions, no side effects, no DOM:

- `calcRound(players: number): number` — find next power of 2
- `getSeedingOrder(pos: number[]): number[]` — recursive seeding
- `getByes(pos: number[]): number[]` — bye position calculation
- `getAdjacentPositions(pos: number[], bye: number): number[]`
- `getWinnersRunnerupsAndByes(pos, seedingOrder, runnerUpsCount, winnersCount, byesCount): { winners, runnerups, byes }`

All functions exported for testing.

### `web/src/lib/draw.test.ts`

Port of `draw/draw_test.go` using Vitest. Includes:

- The `expected` test table (all 15 cases from Go tests)
- `testGetByesRound` — validates bye positions for rounds 4 through 1024
- Unit tests for each public function

### `web/src/lib/calculateDraw.ts`

Thin wrapper that replaces `web/src/apis/draw.js`. Takes `{ winners, runnerups }`, calls the local functions, returns the same shape the frontend currently expects:

```ts
{ rounds, winners: number[], runnerups: number[], byes: number[] }
```

## Files to Modify

### `web/src/pages/Draw.svelte`

Replace:
```js
import { calculateDraws } from "../apis/draw";
```
With:
```js
import { calculateDraws } from "../lib/calculateDraw";
```

The return shape is identical, so the rest of the component stays the same. The `calculatePromise` flow (loading → result → error) continues to work — the function is synchronous but wrapped in a Promise-like call, so the `{#await}` block still functions. We'll keep returning a Promise for UI consistency.

### `web/vite.config.js`

Remove the `/api` proxy (no backend to proxy to).

### `web/package.json`

Add `vitest` as a dev dependency. Add a `"test"` script.

### `firebase.json`

Remove any Cloud Run rewrite rules (if present). The entire site is static.

## Files to Delete

- `main.go`
- `go.mod`, `go.sum`
- `Dockerfile`
- `.air.conf`
- `api/` directory
- `draw/` directory (Go source)
- `web/src/apis/draw.js` (replaced by `web/src/lib/calculateDraw.ts`)

## What Doesn't Change

- `web/src/components/SplitDraw.svelte` — rendering component, no API dependency
- `web/src/components/Logo.svelte`
- Firebase Hosting config (just stops proxying to Cloud Run)
- `.firebaserc`, `firebase.json` (minus rewrites if any)

## Validation

The Go test table has 15 cases covering bracket sizes from 4 to 16 slots. After porting:

1. All Vitest tests pass (matching Go test expectations exactly)
2. Manual smoke test: open the app, enter winners=20, runnerups=20, verify same output as before

## Deployment Simplification

Before: `gcloud builds submit` + `gcloud run deploy` + `firebase deploy` (3 steps, 2 services)
After: `cd web && npm run build && firebase deploy` (1 step, 1 service)

No more Cloud Run costs. No more container registry. No more Docker.

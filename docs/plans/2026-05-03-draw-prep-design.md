# Draw Preparation Feature Design

## Overview

A new page allowing users to prepare for a knockout draw from group stages. Users define groups, fill in winner/runner-up details, draw positions interactively, and see a live knockout chart. State is persisted in localStorage with 7-day expiry and supports export/import.

## Architecture

```
App.svelte
├── Header with tab navigation (Draw Calculator | Draw Preparation)
├── Draw.svelte              (existing, unchanged)
└── DrawPrep.svelte          (new page)
    ├── DrawPrepGroups.svelte     (left panel - groups form)
    │   ├── GroupCard.svelte × N  (one per group)
    │   └── ActionButtons         (export/import/reset)
    └── DrawPrepChart.svelte      (right panel - KO chart)
```

**Navigation:** Simple `selectedPage` string in `App.svelte` toggles between `"draw"` and `"drawPrep"`. Two styled tabs in the header. No router library.

**Layout (wide screens):** Side by side — groups form on the left, KO chart on the right. Both panels share the same viewport height (`calc(100vh - header - footer)`) and scroll independently via `overflow-y: auto`. On narrow screens they stack vertically.

**New files:**
- `src/pages/DrawPrep.svelte` — orchestrates state, calls `calculateDraws`, handles export/import
- `src/components/DrawPrepGroups.svelte` — renders group cards + action buttons
- `src/components/GroupCard.svelte` — single group with winner/runner-up rows, dropdowns
- `src/components/DrawPrepChart.svelte` — KO chart (same visual structure as `SplitDraw` but accepts typed data)
- `src/lib/storage.ts` — localStorage CRUD with 7-day expiry

**Existing files touched:**
- `App.svelte` — add tabs, swap component

## Data Model

```typescript
interface Player {
  na: string;           // 3-char National Association (e.g. "KOR")
  name: string;         // Player name
  position: number | null; // Drawn position in KO chart
}

interface Group {
  winner: Player;
  hasRunnerUp: boolean;
  runnerUp: Player | null;
}

interface DrawPrepState {
  id: string;
  createdAt: number;
  numGroups: number;
  groups: Group[];
  round: number;
  baseWinnerPositions: number[];
  baseRunnerUpPositions: number[];
  baseByePositions: number[];
}
```

- `Player` is shared for winner/runner-up.
- `hasRunnerUp` defaults to `true`; user unticks it if a group has no runner-up.
- Positions are mutable (`null` → assigned → can be re-assigned).
- `base*Positions` are computed by `calculateDraws` assuming all groups have runner-ups. `baseWinnerPositions` and `baseByePositions` are sorted numerically for display; `baseRunnerUpPositions` preserves the original API order (used for deterministic removal order). Active positions are derived at render time.

## Position Management

### Derived State (reactive)

Every time a winner's position changes, recompute active positions:

```
activeRunnerUpPositions = baseRunnerUpPositions - removedSlots
activeByePositions = baseByePositions + removedSlots
activeWinnerPositions = baseWinnerPositions (unchanged)
```

### Runner-Up Slot Removal

For each group where `hasRunnerUp === false` AND `winner.position !== null` (processed in group order):

1. Determine which half the winner is in (top = pos ≤ round/2, bottom = pos > round/2)
2. Find runner-up candidates in the **opposite** half (excluding already-removed slots)
3. Remove the **last candidate in API order** (i.e. the last element of `baseRunnerUpPositions` that falls in the opposite half and hasn't been removed yet)
4. Add that slot to active byes

Multiple groups can have no runner-up. If two groups without runner-ups both have winners in the same half, two runner-up slots are removed from the opposite half (last in API order first).

### Dropdown Options

- **Winner dropdown:** `activeWinnerPositions.filter(p => !occupied.has(p))`
- **Runner-up dropdown:** `activeRunnerUpPositions.filter(p => !occupied.has(p) && isInOppositeHalf(p, group.winner.position))`

Runner-up dropdown is **disabled** if the group's winner hasn't been placed yet, with message "Place the group winner first."

### Cascade on Winner Reposition

When a winner's position changes:
1. Remove old position from occupied set, add new position
2. Recompute removed runner-up slots
3. If any previously placed runner-up now conflicts (their slot was removed), clear their position and show a warning toast
4. Update all dropdowns

### Placed Position Tracking

A `Set<number>` tracks occupied positions. Updated on every position assign/clear.

## Export, Import & Local Storage

### localStorage Schema

Key `"draw-prep"` stores a lookup object: `{ [stateId]: { id, createdAt, numGroups, groups } }`

Only essential data is persisted — no computed positions (re-derived from `calculateDraws` on load). On app init, `loadAll()` purges entries where `Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000`.

### Export

Downloads a `.json` file named `draw-prep-<timestamp>.json` containing the full state (including `numGroups`, `groups`, but not `base*Positions`).

### Import

File upload via hidden `<input type="file">`. On load:
1. Validate JSON structure (`numGroups`, `groups` array of correct shape)
2. Recompute `round`, `base*Positions` via `calculateDraws`
3. Validate all placed positions fall within valid ranges
4. Confirm "This will replace your current draw preparation. Continue?"
5. Replace current state and save to localStorage

### Persistence Timing

Auto-save on every meaningful change with 500ms debounce on text input.

## KO Chart Display (DrawPrepChart.svelte)

Same visual layout as `SplitDraw` but accepts typed data instead of a string array:

- Unplaced winner/runner-up slot → position number only
- BYE slot → position number + "BYE" label (gray italic, matching SplitDraw)
- Placed winner → position number + "NAME (NA)" (green styling)
- Placed runner-up → position number + "NAME (NA)" (orange styling)

## Testing

### Unit Tests (vitest)

- `storage.test.ts` — save, load, loadAll, expiry cleanup, remove
- `draw-prep-state.test.ts` — derive active positions, runner-up slot removal, half constraint, cascade on winner reposition

Key test cases:
- No groups missing runner-ups → active positions = base positions
- Multiple groups without runner-ups, winners in same/different halves
- Winner repositioned to different half → removed slots update accordingly
- Runner-up already placed in a slot that gets removed → position cleared

### UI Error Handling

- Invalid group count (< 1 or > 128) → inline error, disable confirm
- NA field not exactly 3 chars → warning (don't block)
- Player name empty when assigning position → warning "Enter player name before drawing"
- All positions filled → completion message

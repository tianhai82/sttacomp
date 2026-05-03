# Draw Preparation — Implementation Plan

## Task 1: Storage module with 7-day expiry

<!-- tdd: new-feature -->
<!-- checkpoint: test -->

**Files:** `web/src/lib/storage.ts`, `web/src/lib/storage.test.ts`

Write `storage.ts` with:
- `save(state: DrawPrepState): void` — stores under key `"draw-prep"`, keyed by `state.id`
- `load(id: string): DrawPrepState | null` — returns null if missing or expired
- `loadAll(): Record<string, DrawPrepState>` — returns all non-expired entries, purges expired ones
- `remove(id: string): void` — deletes entry
- Expiry: `Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000`

Define the types (`Player`, `Group`, `DrawPrepState`) in a shared `web/src/lib/types.ts`.

Write `storage.test.ts`:
- save and load round-trip
- load returns null for missing id
- expired entries are purged on loadAll
- remove deletes entry
- load returns null for expired entry

```bash
cd web && npx vitest run src/lib/storage.test.ts
# Expected: all tests pass
```

Commit: `feat: add storage module with 7-day expiry`

---

## Task 2: Position derivation logic

<!-- tdd: new-feature -->
<!-- checkpoint: test -->

**Files:** `web/src/lib/positions.ts`, `web/src/lib/positions.test.ts`

Write `positions.ts` with:
- `deriveActivePositions(state: DrawPrepState): { winners: number[], runnerups: number[], byes: number[] }`
  - Uses `baseWinnerPositions`, `baseRunnerUpPositions`, `baseByePositions` from state
  - For each group where `!hasRunnerUp && winner.position !== null` (in group order):
    - Determine half of winner position
    - Find runner-up candidates in opposite half (excluding already removed)
    - Remove highest-index candidate from runner-ups, add to byes
- `getOccupiedPositions(groups: Group[]): Set<number>` — collects all non-null positions
- `getAvailablePositions(active: number[], occupied: Set<number>): number[]` — filter
- `isInOppositeHalf(pos: number, winnerPos: number, round: number): boolean`

Write `positions.test.ts`:
- No groups missing runner-ups → active = base
- One group without runner-up, winner in bottom half → highest runner-up in top half removed
- One group without runner-up, winner in top half → highest runner-up in bottom half removed
- Two groups without runner-ups, winners in same half → two runner-ups removed from opposite half
- Two groups without runner-ups, winners in different halves → one removed from each half
- getOccupiedPositions returns correct set
- getAvailablePositions filters correctly
- isInOppositeHalf works for top/bottom

```bash
cd web && npx vitest run src/lib/positions.test.ts
# Expected: all tests pass
```

Commit: `feat: add position derivation logic for draw prep`

---

## Task 3: App navigation tabs

<!-- tdd: trivial -->
<!-- checkpoint: none -->

**Files:** `web/src/App.svelte`

Add tab navigation to the header:
- Two tabs: "Draw Calculator" and "Draw Preparation"
- `selectedPage` reactive variable, default `"draw"`
- Commented-out button replaced with styled tabs
- Active tab gets `bg-red-700`, inactive gets `bg-red-600`
- `<svelte:component this={component} />` uses `selectedPage` to pick `Draw` or `DrawPrep`

For now, `DrawPrep` is a placeholder component that just renders "Draw Preparation coming soon..."

**File:** `web/src/pages/DrawPrep.svelte` — minimal placeholder.

Verify existing Draw page still works:

```bash
cd web && npx vitest run
# Expected: all existing tests pass
```

Commit: `feat: add tab navigation to app header`

---

## Task 4: Group count input and base position computation

<!-- tdd: new-feature -->
<!-- checkpoint: test -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/components/DrawPrepChart.svelte`

Replace placeholder `DrawPrep.svelte` with:
- Input field for number of groups (1–128)
- "Confirm" button that:
  - Validates group count
  - Creates `DrawPrepState` with empty groups (winner `{na: "", name: "", position: null}`, `hasRunnerUp: true`, `runnerUp: null`)
  - Calls `calculateDraws({ winners: numGroups, runnerups: numGroups })` to get `round`, `baseWinnerPositions`, `baseRunnerUpPositions`, `baseByePositions`
  - Stores computed positions in state
- After confirmation, shows the groups panel area and KO chart

Create `DrawPrepChart.svelte` — initial version:
- Props: `round: number`, `winners: number[]`, `runnerups: number[]`, `byes: number[]`, `placedPlayers: Map<number, {name: string, na: string, type: 'winner' | 'runnerup'}>`
- Renders same visual layout as `SplitDraw` (columns, groups of 4, etc.)
- BYE positions show "BYE" label
- Winner positions show "Winner" label
- Runner-up positions show "Runner-up" label
- Unplaced positions show position number only

Layout: two-panel flex on wide screens (`md:flex-row`), stacked on narrow. Both panels get `overflow-y-auto` and `max-h-[calc(100vh-8rem)]`.

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: group count input and KO chart base positions`

---

## Task 5: Group cards with player input fields

<!-- tdd: modifying-tested-code -->
<!-- checkpoint: none -->

**Files:** `web/src/components/DrawPrepGroups.svelte`, `web/src/components/GroupCard.svelte`, `web/src/pages/DrawPrep.svelte`

Create `GroupCard.svelte`:
- Props: `group: Group`, `groupIndex: number` (1-based)
- Shows "Group N" header
- Row 1 (Winner): NA input (3 chars), Name input, Position dropdown (disabled initially — will be wired in Task 6)
- Row 2 (Runner-up): Same fields, plus a checkbox "Has runner-up" (default checked). Unchecking hides/clears runner-up fields.
- Dispatches events: `update` with `{groupIndex, field, value}`

Create `DrawPrepGroups.svelte`:
- Props: `groups: Group[]`
- Renders `GroupCard` for each group
- Bottom area with Export/Import/Reset buttons (non-functional until later tasks)

Update `DrawPrep.svelte`:
- Import and render `DrawPrepGroups` in left panel
- Wire `update` events to mutate state
- Groups panel shows after confirmation

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: group cards with player input fields`

---

## Task 6: Winner position dropdown and occupy tracking

<!-- tdd: new-feature -->
<!-- checkpoint: done -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/components/GroupCard.svelte`

Wire position assignment in `DrawPrep.svelte`:
- Compute `occupiedPositions` reactively from groups
- Compute `availableWinnerPositions` = `activeWinnerPositions.filter(p => !occupied.has(p))`
- Pass to `GroupCard` as prop `availableWinnerPositions`

In `GroupCard.svelte`:
- Winner position dropdown populated with `availableWinnerPositions`
- On select: dispatch update event with `{field: 'winner.position', value: selectedPos}`
- Option format: `"Position {n}"`, value is the number
- Clear option to remove assignment

In `DrawPrep.svelte`:
- When winner position changes, update `occupiedPositions`
- Pass `placedPlayers` map to `DrawPrepChart` — winner positions show player name in green

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: winner position dropdown with occupy tracking`

---

## Task 7: Runner-up position dropdown with half constraint

<!-- tdd: new-feature -->
<!-- checkpoint: done -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/components/GroupCard.svelte`, `web/src/lib/positions.ts`, `web/src/lib/positions.test.ts`

In `DrawPrep.svelte`:
- Compute `availableRunnerUpPositions` per group: filter `activeRunnerUpPositions` by not occupied AND in opposite half of group's winner position
- If winner not placed yet, pass empty array (dropdown disabled)
- Use `deriveActivePositions` from `positions.ts`

In `GroupCard.svelte`:
- Runner-up position dropdown populated with `availableRunnerUpPositions`
- Disabled with "Place the group winner first" if winner position is null
- On select: dispatch update event

Update `DrawPrepChart`:
- Placed runner-ups show player name in orange

Add to `positions.test.ts`:
- Test that available runner-up positions respect opposite half constraint

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: runner-up position dropdown with opposite half constraint`

---

## Task 8: Cascade on winner reposition

<!-- tdd: modifying-tested-code -->
<!-- checkpoint: done -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/lib/positions.ts`, `web/src/lib/positions.test.ts`

In `DrawPrep.svelte`:
- When a winner's position changes:
  1. Update the position
  2. Recompute `deriveActivePositions` (which may change removed runner-up slots)
  3. Check all placed runner-ups: if any runner-up's position is no longer in `activeRunnerUpPositions`, clear it
  4. Show a warning notification for each cleared runner-up

In `positions.ts`:
- No changes needed — `deriveActivePositions` already handles this

Add to `positions.test.ts`:
- Winner repositioned from bottom half to top half → previously valid runner-up in top half may become invalid if slot was reclassified
- Runner-up in removed slot gets detected

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: cascade runner-up clearance on winner reposition`

---

## Task 9: Export to JSON file

<!-- tdd: trivial -->
<!-- checkpoint: none -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/components/DrawPrepGroups.svelte`

In `DrawPrep.svelte`:
- Add `exportDraw()` function:
  - Build export object: `{ numGroups, groups }` (no computed positions)
  - Create `Blob` with `JSON.stringify(data, null, 2)`
  - Create `<a>` element with `URL.createObjectURL(blob)`
  - Set download filename to `draw-prep-<timestamp>.json`
  - Click programmatically to trigger download

In `DrawPrepGroups.svelte`:
- Wire Export button to dispatch `export` event
- `DrawPrep.svelte` listens and calls `exportDraw()`

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: export draw preparation to JSON file`

---

## Task 10: Import from JSON file

<!-- tdd: trivial -->
<!-- checkpoint: none -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/components/DrawPrepGroups.svelte`

In `DrawPrep.svelte`:
- Add `importDraw(file: File)` function:
  - Read file with `FileReader` / `file.text()`
  - Parse JSON
  - Validate structure: must have `numGroups` (number) and `groups` (array of objects with `winner`, `hasRunnerUp`)
  - Create new `DrawPrepState`, call `calculateDraws` to recompute `round` and `base*Positions`
  - Validate all placed positions are within valid ranges
  - If validation passes, `confirm()` → replace current state
  - Save to localStorage

In `DrawPrepGroups.svelte`:
- Wire Import button to trigger hidden `<input type="file" accept=".json">`
- On file selected, dispatch `import` event with the file

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: import draw preparation from JSON file`

---

## Task 11: Reset and auto-save with 7-day expiry

<!-- tdd: modifying-tested-code -->
<!-- checkpoint: none -->

**Files:** `web/src/pages/DrawPrep.svelte`, `web/src/components/DrawPrepGroups.svelte`

In `DrawPrep.svelte`:
- Add `resetDraw()` function:
  - `confirm("Reset will clear all data. Continue?")`
  - If confirmed, clear state, remove from localStorage, reset to group count input
- Add auto-save:
  - Reactive statement on `state` with debounce (500ms for text, immediate for position changes)
  - Call `storage.save(state)` on changes
- On mount:
  - Call `storage.loadAll()` to purge expired entries
  - Optionally load the most recent saved state

In `DrawPrepGroups.svelte`:
- Wire Reset button to dispatch `reset` event

```bash
cd web && npx vitest run
# Expected: all tests pass
```

Commit: `feat: reset and auto-save with 7-day expiry`

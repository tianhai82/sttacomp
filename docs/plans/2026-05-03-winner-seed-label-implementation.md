# Winner Seed Label Implementation Plan

## Context

Winner positions are currently labeled `Winner: 1`, `Winner: 2`, `Winner: 3`, etc. based on seeding order. Seeds in the same draw group should share a label to indicate they're randomly drawn within that range.

Runner-up labels currently show an index (`Runner-up: 1`) but this is unnecessary.

## Changes

### Task 1: Add `winnerSeedLabel` helper and update labels in Draw.svelte

<!-- tdd: trivial -->
<!-- checkpoint: none -->

**File:** `web/src/pages/Draw.svelte`

1. Add a `winnerSeedLabel(n)` function to `<script>`:

```js
function winnerSeedLabel(n) {
  if (n <= 2) return String(n);
  return '=' + (Math.pow(2, Math.floor(Math.log2(n - 1))) + 1);
}
```

2. Update winner label (line 59):

```js
// Before
players[pos - 1] = `${pos}: Winner: ${i + 1}`;
// After
players[pos - 1] = `${pos}: Winner: ${winnerSeedLabel(i + 1)}`;
```

3. Update runner-up label (line 62):

```js
// Before
players[pos - 1] = `${pos}: Runner-up: ${i + 1}`;
// After
players[pos - 1] = `${pos}: Runner-up`;
```

4. Run `npm test` in `web/` to verify no regressions.
5. `git add -A && git commit -m "feat: group winner seed labels and simplify runner-up labels"`

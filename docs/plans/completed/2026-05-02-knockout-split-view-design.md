# Knockout Chart Split-View Redesign

## Problem

The current knockout chart renders as a single tall left-to-right bracket. For 64+ positions it overflows the screen vertically, making it impossible for the referee to see the full draw at a glance.

## Solution

Replace the horizontal bracket with a compact split-view layout that fits on one screen.

## Layout

**Column strategy by draw size:**

| Draw size | Columns | Content per column |
|-----------|---------|-------------------|
| ≤ 32 | 2 | Top half (1–16) · Bottom half (17–32) |
| ≤ 64 | 2 | Top half (1–32) · Bottom half (33–64) |
| 128 | 4 | Quarter 1 · Quarter 2 · Quarter 3 · Quarter 4 |

**Nested hierarchy within each column:**

```
Column (top half / bottom half / quarter)
  └─ Quarter — dark container with border + subtle background
       └─ Eighth — darker container with border
            └─ Group of 4 — white card with shadow
                 └─ Player row — position badge + label
```

No connecting bracket lines to finals. The referee just needs to see which positions fall in which half/quarter/eighth.

## Data

No API changes. Player labels remain as current:
- `Winner X` (green text)
- `Runner-up X` (orange text)
- `BYE` (grey italic, no country badge)

The existing `/api/draw/winners/:winners/runnerups/:runnerups` endpoint returns `winners`, `runnerups`, `byes` position arrays and `rounds` count. The frontend maps these to positions in the split view.

## Visual Style

- Dark green radial gradient background
- White player cards (`#fff → #e2e8f0` gradient) with box shadow
- Yellow position badge (`#fde047 → #eab308` gradient) on the left of each row
- Nested borders: quarter (subtle white border), eighth (darker bg), group of 4 (white card)
- Oswald font for player names, sans-serif for position numbers

## Components

### New: `SplitDraw.svelte`

Replaces `Knockout.svelte` + `Match.svelte`.

Props:
- `round: number` — total positions (power of 2)
- `players: string[]` — array of labels indexed by position

Renders the column split and nested groups. Determines column count from `round`:
- `round <= 32` → 2 columns
- `round <= 64` → 2 columns
- `round === 128` → 4 columns

### Modified: `Draw.svelte`

Replace `<Knockout>` usage with `<SplitDraw>`. Keep the existing input form, results sections (winners/runner-ups/byes position lists), and API call unchanged.

### Removed: `Knockout.svelte`, `Match.svelte`

No longer needed — the bracket-style layout is replaced by the split view.

## Testing

- Visual verification at 16, 32, 64, and 128 positions
- Verify BYE, Winner, and Runner-up labels render correctly
- Verify the chart fits on one screen without scrolling at 64 positions
- Responsive: columns should stack vertically on narrow screens

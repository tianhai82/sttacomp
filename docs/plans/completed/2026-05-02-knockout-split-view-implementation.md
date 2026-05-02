# Knockout Split-View Implementation Plan

Design doc: `docs/plans/2026-05-02-knockout-split-view-design.md`
Reference mockups: `docs/plans/mockup-32.html`, `docs/plans/mockup-64.html`, `docs/plans/mockup-128.html`

---

## Task 1: Create SplitDraw.svelte component

<!-- tdd: trivial -->
<!-- checkpoint: none -->

Create `web/src/components/SplitDraw.svelte` — the new split-view draw component that replaces Knockout + Match.

Props: `round` (number, power of 2), `players` (string[], labels indexed by position).

The component:
- Determines column count: `round <= 64` → 2 columns (top half / bottom half), `round === 128` → 4 columns (quarters)
- Splits positions into columns: each column gets `round / columnCount` positions
- Within each column, groups positions into quarters (16), eighths (8), and groups of 4
- Renders the nested border hierarchy: quarter → eighth → group of 4 → player rows
- Player row shows yellow position badge + label text (Winner X / Runner-up X / BYE)
- BYE rows styled with grey italic text
- Uses scoped styles matching the mockup visual (dark green bg, white cards, yellow badges)
- Responsive: columns stack vertically on narrow screens via flex-wrap

```svelte
<script>
  export let round = 1;
  export let players = [];

  $: columnCount = round <= 64 ? 2 : 4;
  $: positionsPerColumn = round / columnCount;

  function getColumns(round, players, columnCount, positionsPerColumn) {
    const columns = [];
    for (let c = 0; c < columnCount; c++) {
      const startPos = c * positionsPerColumn + 1;
      const quarters = [];
      const quarterCount = positionsPerColumn / 16;
      for (let q = 0; q < quarterCount; q++) {
        const quarterStart = startPos + q * 16;
        const eighths = [];
        for (let e = 0; e < 2; e++) {
          const eighthStart = quarterStart + e * 8;
          const groups = [];
          for (let g = 0; g < 2; g++) {
            const groupStart = eighthStart + g * 4;
            const groupPlayers = [];
            for (let p = 0; p < 4; p++) {
              const pos = groupStart + p;
              groupPlayers.push({
                pos,
                label: players[pos - 1] || `${pos}`,
                isBye: (players[pos - 1] || '').toUpperCase().includes('BYE'),
                isWinner: (players[pos - 1] || '').toLowerCase().includes('winner'),
                isRunnerUp: (players[pos - 1] || '').toLowerCase().includes('runner-up'),
              });
            }
            groups.push(groupPlayers);
          }
          eighths.push(groups);
        }
        quarters.push(eighths);
      }
      const isTopHalf = c < columnCount / 2;
      columns.push({
        label: columnCount === 2 ? (c === 0 ? 'TOP HALF' : 'BOTTOM HALF') : `QUARTER ${c + 1}`,
        quarters,
      });
    }
    return columns;
  }

  $: columns = getColumns(round, players, columnCount, positionsPerColumn);
</script>

<style>
  .columns-container {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .column {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 260px;
  }
  .column-label {
    font-size: 14px;
    font-weight: bold;
    color: #eee;
    margin-bottom: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .column-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
  .quarter {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px;
  }
  .eighth {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 2px;
  }
  .group {
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #ffffff 0%, #e2e8f0 100%);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    border: 1px solid #94a3b8;
  }
  .player {
    display: flex;
    align-items: center;
    height: 19px;
    font-size: 11px;
    color: #0f172a;
  }
  .player + .player {
    border-top: 1px solid #cbd5e1;
  }
  .pos {
    background: linear-gradient(to bottom, #fde047, #eab308);
    font-weight: 700;
    min-width: 22px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid #94a3b8;
    color: #000;
    font-size: 11px;
  }
  .name {
    flex: 1;
    font-weight: 700;
    padding-left: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name.winner { color: #15803d; }
  .name.runner-up { color: #c2410c; }
  .name.bye { color: #64748b; font-style: italic; font-weight: 500; }
</style>

<div class="columns-container">
  {#each columns as column}
    <div class="column">
      <div class="column-label">{column.label}</div>
      <div class="column-body">
        {#each column.quarters as quarter}
          <div class="quarter">
            {#each quarter as eighth}
              <div class="eighth">
                {#each eighth as group}
                  <div class="group">
                    {#each group as player}
                      <div class="player">
                        <span class="pos">{player.pos}</span>
                        <span class="name {player.isBye ? 'bye' : player.isWinner ? 'winner' : player.isRunnerUp ? 'runner-up' : ''}">
                          {player.label}
                        </span>
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
```

Commit: `feat: add SplitDraw.svelte component`

---

## Task 2: Wire SplitDraw into Draw.svelte and add dark background

<!-- tdd: trivial -->
<!-- checkpoint: none -->

Modify `web/src/pages/Draw.svelte`:
1. Replace `import Knockout from "../components/Knockout.svelte"` with `import SplitDraw from "../components/SplitDraw.svelte"`
2. Replace `<Knockout {round} {players} />` with `<SplitDraw {round} {players} />`
3. Change the wrapper div around the draw chart to use the dark green background:
   - Change `<div class="rounded-lg my-4 mx-2 py-4 px-4 elevation-3 overflow-x-auto">` to `<div class="rounded-lg my-4 mx-2 py-4 px-4 overflow-x-auto" style="background: radial-gradient(circle at center, #233c2d 0%, #101c15 100%);">`

The exact edit for Draw.svelte — change the import line:
```
- import Knockout from "../components/Knockout.svelte";
+ import SplitDraw from "../components/SplitDraw.svelte";
```

And change the chart section:
```
- <Knockout {round} {players} />
```
to:
```
- <SplitDraw {round} {players} />
```

And change the wrapper:
```
- <div class="rounded-lg my-4 mx-2 py-4 px-4 elevation-3 overflow-x-auto">
+ <div class="rounded-lg my-4 mx-2 py-4 px-4 overflow-x-auto" style="background: radial-gradient(circle at center, #233c2d 0%, #101c15 100%);">
```

Commit: `feat: wire SplitDraw into Draw page with dark background`

---

## Task 3: Verify with dev server and clean up old components

<!-- tdd: trivial -->
<!-- checkpoint: done -->

1. Start the dev server: `cd web && yarn dev`
2. Open browser, enter 20 winners + 20 runner-ups, click Calculate
3. Verify the split view renders correctly:
   - Two columns (top half / bottom half)
   - Nested quarter → eighth → group borders visible
   - Yellow position badges
   - Winner labels in green, Runner-up in orange, BYE in grey italic
   - Dark green background
4. Test with other draw sizes: 8+8 (32 draw), 32+32 (64 draw)
5. Once verified, delete the old components:
   - `rm web/src/components/Knockout.svelte`
   - `rm web/src/components/Match.svelte`

Commit: `chore: remove old Knockout and Match components`

# Draw List — Multiple Saved Draws

## Problem

The Do Draw page only works with one draw at a time. To switch draws, users must export to JSON and re-import. localStorage already stores multiple draws, but there's no UI to browse or switch between them.

## Solution

Add a "My Draws" landing view as the first thing users see on `/draw-prep`. It shows all saved draws as cards in a grid, with options to open, create, or delete draws.

## User Flow

```
/draw-prep
  │
  ├─ No draws yet → show "My Draws" with empty state + "New Draw" button
  │
  ├─ Has draws → show card grid sorted by most recent
  │    │
  │    ├─ Click card → load that draw (editing view)
  │    ├─ Click [+ New Draw] → show setup form
  │    └─ Click [🗑] → confirm → delete → card disappears
  │
  └─ After creating/opening a draw → editing view (current groups + chart)
       └─ "Back" button in header → returns to draw list
```

## Views (3 states in DrawPrep.svelte)

### 1. `list` — Draw card grid (new default landing)

```
Desktop: 2–3 column card grid
Mobile: single column stacked cards
```

Each card shows:
- Event name (or "Untitled Draw" if empty)
- Group count badge
- Last modified date
- Delete button (🗑 with confirm dialog)

Top-right: "+ New Draw" button

### 2. `setup` — Current setup form (event name + group count + confirm/import)

Unchanged from current behavior. Shown after clicking "+ New Draw".

### 3. `editing` — Current confirmed state (groups form + KO chart)

Mostly unchanged. A "Back to My Draws" link/button is added to the header area so users can return to the list.

## Components

### New: `DrawList.svelte`

Card grid for browsing saved draws.

**Props:**
- `draws: DrawSummary[]` — list of saved draws sorted by recency
- `onOpen: (id: string) => void` — open a draw
- `onNew: () => void` — create new draw
- `onDelete: (id: string) => void` — delete a draw

**DrawSummary type:**
```ts
interface DrawSummary {
  id: string;
  eventName: string;
  numGroups: number;
  createdAt: number;
}
```

### Modified: `DrawPrep.svelte`

Add a `view` state: `'list' | 'setup' | 'editing'`.

- On mount: call `listAll()` instead of `loadMostRecent()`. If draws exist, show `list`. If no draws, show `setup` (skip empty list for zero-state).
- `onOpen`: load the selected draw by ID, transition to `editing`.
- `onNew`: transition to `setup`.
- `onDelete`: call `storageRemove(id)`, refresh list.
- Add a "Back" action in the editing header to return to `list`.
- Remove the existing `onMount` logic that auto-loads `loadMostRecent()`.

### Modified: `storage.ts`

Add `listAll()`:
```ts
export function listAll(): DrawSummary[] {
  const store = getStore();
  // purge expired, then return summaries sorted by createdAt desc
}
```

### Unchanged

- `DrawPrepGroups.svelte` — no changes
- `DrawPrepChart.svelte` — no changes
- `GroupCard.svelte` — no changes
- Export/Import/Reset in editing view — unchanged
- Auto-save via `$effect` — unchanged
- 7-day expiry — unchanged

## Data Flow

```
localStorage (single key "draw-prep")
  └─ Record<string, DrawPrepState & { createdAt }>
       │
       ├─ listAll() → DrawSummary[] (for card grid)
       ├─ load(id) → DrawPrepState (for opening a draw)
       ├─ save(state) → upsert (auto-save, unchanged)
       └─ remove(id) → delete (for delete + reset)
```

## Edge Cases

- **No draws exist**: skip the list view, go straight to setup form with a friendly "Create your first draw" message.
- **Expired draws**: `listAll()` purges expired entries before returning, same as current `loadAll()` behavior.
- **Untitled draws**: cards show "Untitled Draw" when `eventName` is empty.
- **Delete the currently open draw from the list**: not possible — delete only available from the list view, not while editing.
- **Browser back button**: not addressed in this iteration (hash router complexity). Users click the UI "Back" button.

## Testing

- `storage.test.ts`: add tests for `listAll()` — empty store, expired entries purged, sorted by recency
- `DrawList.svelte`: visual component, manual testing sufficient
- Integration: create draw → see it in list → open → back → delete → confirmed gone

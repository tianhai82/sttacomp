# Draw Empty State & Delete UX

## Problem

Two UX issues in the Do Draw tab:

1. **Empty state skips "My Draws"** — when no draws exist, `onMount` jumps straight to "Draw Preparation Setup". First-time users never learn that draws are saved and manageable. The import path is hidden inside the setup form.
2. **"Reset" button is misleading** — it's labeled "Reset" but actually deletes the saved draw from localStorage. It sits next to Export/Import in the groups form, risking accidental clicks. The name and placement don't match its destructive nature.

## Solution

### Change 1: Always show "My Draws" list, with drop zone for imports

**Before:** No draws → skip list → show setup form.
**After:** No draws → show "My Draws" with empty state + drop zone + import button.

The empty state becomes a clear landing with two equal paths:
- **+ New Draw** → setup form (manual entry)
- **Import Draw** → file picker or drag-and-drop

`onMount` always sets `view = 'list'`. The special case `view = 'setup'` when empty is removed.

#### Drop zone behavior

The empty-state area (the `text-center py-12` div) becomes a drop zone:

```
┌─────────────────────────────────────────┐
│  My Draws                    + New Draw │
│                                         │
│          📄                              │
│     No draws yet                        │
│  Drag & drop a .json file here          │
│      or                                 │
│     [Import Draw]                       │
│                                         │
└─────────────────────────────────────────┘
```

- **Drag over:** border dashes + light blue background (`border-blue-400 bg-blue-50`)
- **Drop:** validate file, call `onImport` prop (same handler as existing import)
- **Click "Import Draw":** triggers hidden file input (same as current)
- **Drag enter/leave counter:** track child element events to avoid flicker
- **Non-.json file dropped:** show error briefly, reset drop zone

**Props change for `DrawList.svelte`:**
```ts
let {
  draws = [],
  onOpen,
  onNew,
  onDelete,
  onImport,        // new: (file: File) => void
} = $props();
```

The `onImport` flows through: `DrawList.onImport` → `DrawPrep.importDraw(file)`.

### Change 2: Trash icon in top nav bar, remove Reset from groups

**Before:** `[Export] [Import] [Reset]` in `DrawPrepGroups.svelte`.
**After:** Trash icon (🗑) in the back-link bar of `DrawPrep.svelte`. `DrawPrepGroups.svelte` only has `[Export] [Import]`.

```
← Back to My Draws                    🗑
```

- Clicking trash triggers `confirm('Delete this draw? This cannot be undone.')` then deletes and returns to list.
- The trash icon is in `DrawPrep.svelte`, not in `DrawPrepGroups.svelte` — deletion is a draw-level concern, not a groups concern.

## Slices

### Slice 1: Always show "My Draws" list

- Remove the `if (draws.length === 0) view = 'setup'` branch in `onMount`
- Always set `view = 'list'` on mount
- This is the minimal change — empty state already shows "No draws yet" + "Create your first draw"

### Slice 2: Drop zone on empty state

- Add `onImport` prop to `DrawList.svelte`
- Replace the empty-state div with a drop zone component (inline, not a separate file)
- Handle `dragenter`/`dragover`/`dragleave`/`drop` events
- Add hidden file input + "Import Draw" button
- Style: dashed border, icon, hover/active states
- Pass `importDraw` from `DrawPrep.svelte` as `onImport` to `DrawList`

### Slice 3: Move delete to top bar

- Add trash icon button to the back-link bar in `DrawPrep.svelte` (editing view)
- Wire it to `resetDraw()` (with updated confirm text)
- Remove `onReset` prop from `DrawPrepGroups.svelte`
- Remove Reset button from `DrawPrepGroups.svelte`
- Remove `onReset={resetDraw}` from the `<DrawPrepGroups>` call site

## Files Changed

| File | Change |
|---|---|
| `DrawPrep.svelte` | Always `view = 'list'` on mount. Pass `onImport={importDraw}` to `DrawList`. Add trash icon in back-link bar. Remove `onReset` from `<DrawPrepGroups>`. |
| `DrawList.svelte` | Add `onImport` prop. Replace empty-state with drop zone + import button. |
| `DrawPrepGroups.svelte` | Remove `onReset` prop and Reset button. |

## Testing

- **Manual:** Fresh localStorage → Do Draw tab → see "My Draws" empty state → drag a .json file → draw loads. Click "New Draw" → setup form appears. Create draw → editing view → trash icon in top bar → confirm → back to list with the draw gone.
- **Existing tests:** `DrawPrepGroups.test.ts` — remove any assertions about Reset button if they exist.
- **No new unit tests needed** — the drop zone is visual/DOM behavior, manual testing is sufficient.

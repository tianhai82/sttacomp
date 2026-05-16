# Draw Import & Routing Design

## Problem

1. **Wrong import warning** — importing a draw always shows "Importing will replace the current draw" even when the draw list is empty.
2. **Import only available during editing** — the Import button lives inside `DrawPrepGroups` (editing view). When the draw list has existing draws, there's no way to import.
3. **No URL paths** — "My Draws" and individual draws have no hash routes, so no browser back/forward or bookmarking.

## Design

### Routing

**Routes in `App.svelte`:**

| Route | View |
|---|---|
| `/draw-prep` | My Draws list |
| `/draw-prep/draw/:id` | Editing a specific draw |

Setup (new draw form) is an inline state within the list view, not a separate route.

**`DrawPrep.svelte`** accepts `params` from the router:

```js
let { params = {} } = $props();
```

Derives view from the route:
- No `params.id` → list view, load `draws = listAll()`
- `params.id` present → `openDraw(params.id)`

**Navigation helpers use `goto()`:**
- `backToList()` → `goto('/draw-prep')`
- `openDraw(id)` → `goto('/draw-prep/draw/' + id)`
- After creating/importing a draw → `goto('/draw-prep/draw/' + state.id)`

**Edge case — invalid draw ID:** if `storageLoad(id)` returns null, redirect to `/draw-prep`.

**Component destruction:** since route changes remount the component, add `onDestroy` to immediately save state before teardown:

```js
onDestroy(() => {
  if (state) storageSave(state);
});
```

This prevents data loss from the debounced auto-save (500ms) being cancelled on unmount.

### Import Behavior

**Import is always accessible** from the list view:
- Import button in the DrawList header (next to "+ New Draw")
- Drag & drop on the list (empty or non-empty)
- Empty-state drop zone still has its own Import button

**Import flow in `DrawPrep.svelte`:**

1. Parse and validate the file (same as current logic)
2. **Name collision check** — compare imported `eventName` against existing draws:
   - **No collision** → save as new draw, navigate to it
   - **Collision** → show confirm dialog: `"A draw named 'X' already exists."` with options:
     - **Replace** — overwrite existing draw (same ID, URL stays valid)
     - **Import with new name** — `prompt()` for a new name, validate it doesn't collide with any existing draw names (re-prompt if it does), save as new draw with new ID
3. Save and navigate to `/draw-prep/draw/{id}`

**Remove Import from `DrawPrepGroups.svelte`:** import creates a new draw, so it belongs in the list context, not the editing view. Export stays.

### DrawList Changes

- Always show Import button in the header bar
- Move drag handlers to the outer container (not just empty state)
- Hidden file input for the button trigger

### Setup Flow

"New Draw" shows an inline setup form within the list view. On confirm:
- Build and save the draw
- Navigate to `/draw-prep/draw/{id}`

Hitting browser back during setup returns to `/draw-prep` (list) — setup state is lost, which is acceptable (like closing a modal).

## Files Changed

| File | Change |
|---|---|
| `src/App.svelte` | Add `/draw-prep/draw/:id` route |
| `src/pages/DrawPrep.svelte` | Accept params, derive view from route, refactor import logic, add onDestroy save |
| `src/components/DrawList.svelte` | Add Import button to header, move drag handlers to outer div |
| `src/components/DrawPrepGroups.svelte` | Remove Import button and file input |

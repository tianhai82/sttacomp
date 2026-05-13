# Draw List — Implementation Plan

Design doc: `docs/plans/2026-05-13-draw-list-design.md`

---

## Task 1: Add `listAll()` to storage with tests

<!-- tdd: new-feature -->

Files:
- `web/src/lib/types.ts` — add `DrawSummary` type
- `web/src/lib/storage.ts` — add `listAll()` function
- `web/src/lib/storage.test.ts` — add tests for `listAll()`

Steps:

1. Add `DrawSummary` interface to `web/src/lib/types.ts`:

```ts
export interface DrawSummary {
  id: string;
  eventName: string;
  numGroups: number;
  createdAt: number;
}
```

2. Add `listAll()` to `web/src/lib/storage.ts`. Import `DrawSummary` from types. Place it after the existing `loadMostRecent` function:

```ts
export function listAll(): DrawSummary[] {
  const store = getStore();
  let changed = false;
  const summaries: DrawSummary[] = [];
  for (const [id, entry] of Object.entries(store)) {
    if (isExpired(entry.createdAt)) {
      delete store[id];
      changed = true;
    } else {
      summaries.push({
        id: entry.id,
        eventName: entry.eventName || "",
        numGroups: entry.numGroups,
        createdAt: entry.createdAt,
      });
    }
  }
  if (changed) {
    setStore(store);
  }
  return summaries.sort((a, b) => b.createdAt - a.createdAt);
}
```

3. Add tests to `web/src/lib/storage.test.ts`. Import `listAll` alongside the other imports. Add a new `describe("listAll")` block at the end of the file:

```ts
describe("listAll", () => {
  it("returns empty array when store is empty", () => {
    expect(listAll()).toEqual([]);
  });

  it("returns summaries sorted by createdAt descending", () => {
    const oldest = makeState({ id: "oldest", createdAt: 1000, eventName: "Old" });
    const newest = makeState({ id: "newest", createdAt: 3000, eventName: "New" });
    const middle = makeState({ id: "middle", createdAt: 2000, numGroups: 8, eventName: "Mid" });
    save(oldest);
    save(middle);
    save(newest);

    const result = listAll();
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("newest");
    expect(result[1].id).toBe("middle");
    expect(result[2].id).toBe("oldest");
    expect(result[0].eventName).toBe("New");
    expect(result[1].numGroups).toBe(8);
  });

  it("purges expired entries and excludes them from results", () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fresh = makeState({ id: "fresh", createdAt: Date.now(), eventName: "Fresh" });
    const expired = makeState({ id: "expired", createdAt: Date.now() - sevenDaysMs - 1, eventName: "Gone" });
    save(fresh);
    save(expired);

    const result = listAll();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fresh");
  });

  it("returns empty eventName as empty string when not set", () => {
    const state = makeState({ id: "no-name", createdAt: Date.now() });
    // Manually store without eventName to simulate backward compat
    const raw = JSON.parse(localStorage.getItem("draw-prep")!);
    delete raw["no-name"].eventName;
    localStorage.setItem("draw-prep", JSON.stringify(raw));

    const result = listAll();
    expect(result).toHaveLength(1);
    expect(result[0].eventName).toBe("");
  });
});
```

4. Run tests:

```bash
cd web && npx vitest run src/lib/storage.test.ts
```

All tests (old + new) should pass.

---

## Task 2: Create `DrawList.svelte` component

<!-- tdd: trivial -->

Files:
- `web/src/components/DrawList.svelte` — new component

Steps:

1. Create `web/src/components/DrawList.svelte`:

```svelte
<script>
  import Btn from "./Btn.svelte";

  let {
    draws = [],
    onOpen,
    onNew,
    onDelete,
  } = $props();

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function handleDelete(id, eventName) {
    const label = eventName || "Untitled Draw";
    if (confirm(`Delete "${label}"? This cannot be undone.`)) {
      onDelete?.(id);
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-medium">My Draws</h2>
    <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>+ New Draw</Btn>
  </div>

  {#if draws.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p class="text-lg mb-4">No draws yet</p>
      <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>Create your first draw</Btn>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each draws as draw (draw.id)}
        <div
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
          onclick={() => onOpen?.(draw.id)}
          onkeydown={(e) => e.key === 'Enter' && onOpen?.(draw.id)}
          role="button"
          tabindex="0"
        >
          <h3 class="font-medium text-gray-900 mb-1 truncate pr-8">
            {draw.eventName || 'Untitled Draw'}
          </h3>
          <p class="text-sm text-gray-500">
            {draw.numGroups} group{draw.numGroups !== 1 ? 's' : ''} · {formatDate(draw.createdAt)}
          </p>
          <button
            class="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onclick|stopPropagation={() => handleDelete(draw.id, draw.eventName)}
            title="Delete draw"
          >
            🗑
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

2. Run existing tests to make sure nothing is broken:

```bash
cd web && npx vitest run
```

All existing tests should pass. The new component has no tests (visual component, manual testing).

---

## Task 3: Wire `DrawPrep.svelte` — 3-view state machine + back button

<!-- tdd: modifying-tested-code -->

Files:
- `web/src/pages/DrawPrep.svelte` — add view state, replace onMount, add back button

Steps:

1. In `web/src/pages/DrawPrep.svelte`, update the imports. Replace `loadMostRecent` with `listAll`:

Change:
```js
import { save as storageSave, remove as storageRemove, loadAll, loadMostRecent } from "../lib/storage";
```
To:
```js
import { save as storageSave, remove as storageRemove, loadAll, load as storageLoad, listAll } from "../lib/storage";
```

Add import for DrawList:
```js
import DrawList from "../components/DrawList.svelte";
```

2. Add view state and draws list. After the existing `let state = $state(null);` line, add:

```js
let view = $state('list'); // 'list' | 'setup' | 'editing'
let draws = $state([]); // DrawSummary[]
```

3. Replace the `onMount` block. Change:

```js
  // On mount: purge expired entries and load most recent state
  onMount(async () => {
    loadAll(); // purge expired
    const recent = loadMostRecent();
    if (!recent) return;

    try {
      const drawData = await computeDrawData(recent.groups.length);
      state = { ...recent, ...drawData };
      eventNameInput = recent.eventName || "";
      confirmed = true;
    } catch (e) {
      storageRemove(recent.id);
    }
  });
```

To:

```js
  // On mount: load draw list, show list (or setup if empty)
  onMount(async () => {
    draws = listAll();
    if (draws.length === 0) {
      view = 'setup';
    }
  });

  async function openDraw(id) {
    loadAll(); // purge expired
    const loaded = storageLoad(id);
    if (!loaded) {
      // Draw expired or missing, refresh list
      draws = listAll();
      return;
    }
    try {
      const drawData = await computeDrawData(loaded.groups.length);
      state = { ...loaded, ...drawData };
      eventNameInput = loaded.eventName || "";
      view = 'editing';
    } catch (e) {
      storageRemove(id);
      draws = listAll();
    }
  }

  function newDraw() {
    state = null;
    confirmed = false;
    numGroupsInput = '';
    eventNameInput = '';
    error = '';
    warnings = [];
    view = 'setup';
  }

  function deleteDraw(id) {
    storageRemove(id);
    draws = listAll();
  }

  function backToList() {
    state = null;
    confirmed = false;
    draws = listAll();
    view = draws.length > 0 ? 'list' : 'setup';
  }
```

4. Update `confirmGroups()` — after setting `confirmed = true`, also set `view = 'editing'`:

Add after the `confirmed = true;` line inside `confirmGroups`:
```js
      view = 'editing';
```

5. Update `importDraw()` — after setting `confirmed = true`, also set `view = 'editing'`:

Add after the `confirmed = true;` line inside `importDraw`:
```js
      view = 'editing';
```

6. Update `resetDraw()` — change to use `backToList()`:

Change the body of `resetDraw` from:
```js
  function resetDraw() {
    if (!confirm('Reset will clear all data. Continue?')) return;
    if (state) {
      storageRemove(state.id);
    }
    state = null;
    confirmed = false;
    numGroupsInput = '';
    eventNameInput = '';
    error = '';
    warnings = [];
  }
```
To:
```js
  function resetDraw() {
    if (!confirm('Reset will clear all data. Continue?')) return;
    if (state) {
      storageRemove(state.id);
    }
    backToList();
  }
```

7. Update the template. The current template has two main blocks: `{#if !confirmed}` and `{:else if state}`. Wrap the entire template content in a 3-way conditional. Replace the template section (everything inside the outermost `<div class="container ...">`) with:

```svelte
  {#if view === 'list'}
    <div class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-white">
      <DrawList {draws} onOpen={openDraw} onNew={newDraw} onDelete={deleteDraw} />
    </div>
  {:else if view === 'setup' && !confirmed}
    <div class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-white">
      <h2 class="text-lg font-medium mb-4">Draw Preparation Setup</h2>
      <div class="mb-3">
        <label class="block text-gray-700 font-medium mb-1" for="eventName">Event name</label>
        <input
          id="eventName"
          type="text"
          placeholder="e.g. U13 Boys Singles"
          class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
          bind:value={eventNameInput}
          onkeydown={(e) => e.key === 'Enter' && confirmGroups()}
        />
      </div>
      <div class="mb-3">
        <label class="block text-gray-700 font-medium mb-1" for="numGroups">Number of groups</label>
        <input
          id="numGroups"
          type="number"
          min="1"
          max="128"
          class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
          bind:value={numGroupsInput}
          onkeydown={(e) => e.key === 'Enter' && confirmGroups()}
        />
      </div>
      <div class="flex items-center gap-3">
        <Btn cls="bg-red-500 text-white" onclick={confirmGroups}>
          Confirm
        </Btn>
        <Btn cls="bg-gray-500 text-white" onclick={() => fileInput.click()}>
          Import
        </Btn>
        <input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={onSetupFileSelected} />
      </div>
      {#if error}
        <div class="text-red-600 text-sm">{error}</div>
      {/if}
    </div>
  {:else if view === 'editing' && state}
    {#if warnings.length > 0}
      <div class="mx-2 mb-2">
        {#each warnings as warning}
          <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded px-3 py-2 mb-1">
            ⚠ {warning}
          </div>
        {/each}
      </div>
    {/if}
    <div class="flex items-center mx-2 mb-2">
      <button
        class="text-sm text-red-600 hover:text-red-800 font-medium"
        onclick={backToList}
      >
        ← Back to My Draws
      </button>
    </div>
    <div class="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
      <!-- Left panel: Groups form -->
      <div class="md:w-1/2 overflow-y-auto min-h-0 {mobileTab === 'groups' ? '' : 'hidden md:block'}">
        <div class="rounded-lg mx-2 p-4 shadow-md bg-white">
          <h2 class="text-lg font-medium mb-4">
            {state.eventName ? `${state.eventName} — ` : ''}Groups ({state.groups.length})
          </h2>
          <DrawPrepGroups
            groups={state.groups}
            availableWinnerPositions={availableWinnerPositions}
            availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
            onChange={handleGroupsChange}
            onExport={exportDraw}
            onImport={importDraw}
            onReset={resetDraw}
          />
        </div>
      </div>
      <!-- Right panel: KO Chart -->
      <div class="md:w-1/2 overflow-y-auto min-h-0 {mobileTab === 'chart' ? '' : 'hidden md:block'}">
        <div class="rounded-lg mx-2 py-4 px-4 overflow-x-auto bg-white">
          <h2 class="text-lg font-medium mb-4">Knockout Chart</h2>
          <DrawPrepChart {...chartProps} />
        </div>
      </div>
    </div>
  {/if}

  <!-- Mobile bottom tab bar -->
  {#if view === 'editing' && state}
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex md:hidden z-40">
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'groups'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        onclick={() => (mobileTab = 'groups')}>
        Groups
      </button>
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'chart'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        onclick={() => (mobileTab = 'chart')}>
        KO Chart
      </button>
    </div>
  {/if}
```

8. Run all tests:

```bash
cd web && npx vitest run
```

All tests should pass. The existing tests don't test `DrawPrep.svelte` directly (it's a page component), so they should be unaffected.

9. Manual verification — start dev server and test the full flow:

```bash
cd web && npm run dev
```

- Navigate to `/draw-prep` → should show setup form (no draws yet)
- Create a draw with "U13 Boys Singles", 4 groups → should go to editing view
- Click "← Back to My Draws" → should show the draw list with one card
- Click the card → should open the draw again
- Click "+ New Draw" → should show setup form
- Create another draw → should go to editing view
- Click "← Back to My Draws" → should show two cards, newest first
- Delete one → confirm dialog → card disappears
- Delete the last one → should show empty state with "Create your first draw"

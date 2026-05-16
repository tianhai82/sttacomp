# Draw Import & Routing — Implementation Plan

## Task 1: Add routes and route-aware view derivation in DrawPrep

<!-- tdd: new-feature -->
<!-- checkpoint: done -->

Files:
- `src/App.svelte` — add `/draw-prep/draw/:id` route
- `src/pages/DrawPrep.svelte` — accept `params`, derive view from route, add `onDestroy` save, wire up `push` for navigation

Steps:

1. Update `src/App.svelte` — add the `:id` sub-route:

```js
import { push } from "svelte-spa-router";

const routes = {
  "/": Draw,
  "/draw-prep": DrawPrep,
  "/draw-prep/draw/:id": DrawPrep,
};
```

Remove the `import { link } from "svelte-spa-router"` and `import active from "svelte-spa-router/active"` if not already gone (they are used — keep them). No other changes needed in App.svelte since both routes point to the same component and `use:active` on the nav link already matches `/draw-prep` as a prefix.

2. Update `src/pages/DrawPrep.svelte`:

- Import `push` from `svelte-spa-router` and `onDestroy` from `svelte`:

```js
import { push } from "svelte-spa-router";
import { onDestroy } from "svelte";
```

- Accept `params` prop and derive `view`:

```js
let { params = {} } = $props();

let view = $derived(
  params.id ? 'editing' : 'list'
);
```

- Remove the old manual `view = $state('list')` declaration.

- Add `showSetup` state for inline new-draw form:

```js
let showSetup = $state(false);
```

- Replace all `view = 'setup'` assignments with `showSetup = true` and `view = 'list'` / `view = 'editing'` assignments with `push()` calls.

- Update `openDraw(id)`:

```js
async function openDraw(id) {
  push(`/draw-prep/draw/${id}`);
}
```

This triggers a route change. The actual loading happens in the reactive block (next step).

- Add a reactive block to load draw when `params.id` changes:

```js
$effect(() => {
  const id = params.id;
  if (id) {
    loadDrawById(id);
  } else {
    draws = listAll();
  }
});

async function loadDrawById(id) {
  loadAll(); // purge expired
  const loaded = storageLoad(id);
  if (!loaded) {
    push('/draw-prep');
    return;
  }
  try {
    const drawData = await computeDrawData(loaded.groups.length);
    state = { ...loaded, ...drawData };
    eventNameInput = loaded.eventName || "";
  } catch (e) {
    storageRemove(id);
    push('/draw-prep');
  }
}
```

- Update `backToList()`:

```js
function backToList() {
  push('/draw-prep');
}
```

- Update `newDraw()`:

```js
function newDraw() {
  state = null;
  confirmed = false;
  numGroupsInput = '';
  eventNameInput = '';
  error = '';
  warnings = [];
  showSetup = true;
}
```

- Update `confirmGroups()` — on success, save and navigate:

```js
async function confirmGroups() {
  const num = parseInt(numGroupsInput, 10);
  if (!num || num < 1 || num > 128) {
    error = "Group count must be between 1 and 128";
    return;
  }
  error = "";

  try {
    const data = await computeDrawData(num);
    state = buildState(num, makeEmptyGroups(num), data);
    storageSave(state);
    showSetup = false;
    push(`/draw-prep/draw/${state.id}`);
  } catch (e) {
    error = e.message || "Failed to calculate draw";
  }
}
```

- Update `resetDraw()` — delete and go to list:

```js
function resetDraw() {
  if (!confirm('Delete this draw? This cannot be undone.')) return;
  if (state) {
    storageRemove(state.id);
  }
  state = null;
  push('/draw-prep');
}
```

- Add `onDestroy` to flush pending saves:

```js
onDestroy(() => {
  if (state) storageSave(state);
});
```

- In the template, replace `{#if view === 'list'}` block. The list view now also includes the setup form when `showSetup` is true. Change the template to:

```svelte
{#if view === 'editing' && state}
  <!-- editing view unchanged -->
{:else}
  <!-- list + setup -->
  <div class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-white">
    {#if showSetup}
      <!-- setup form -->
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
        <Btn cls="bg-red-500 text-white" onclick={confirmGroups}>Confirm</Btn>
        <Btn cls="bg-gray-500 text-white" onclick={() => { showSetup = false; }}>Cancel</Btn>
      </div>
      {#if error}
        <div class="text-red-600 text-sm mt-2">{error}</div>
      {/if}
    {:else}
      <DrawList {draws} onOpen={openDraw} onNew={newDraw} onDelete={deleteDraw} onImport={handleImportFromList} />
    {/if}
  </div>
{/if}
```

- Remove the old `{#if view === 'setup' && !confirmed}` block entirely — it's replaced by the inline setup above.

- Remove the old `onSetupFileSelected` function and its associated `<input>` from the setup block (import now happens from the list).

3. Run existing tests:

```bash
npx vitest run
```

All existing tests should pass. The new routing changes are structural (no new testable logic yet — that comes in Tasks 2 and 3).

4. Verify the app loads in the browser — `npx vite dev`, navigate to `#/draw-prep`, confirm the list shows.

⏸ **CHECKPOINT: done** — present implementation review. Wait for human approval before committing.

---

## Task 2: Refactor importDraw with name collision handling

<!-- tdd: new-feature -->
<!-- checkpoint: test -->

Files:
- `src/lib/importDraw.ts` — new file with extracted import logic
- `src/lib/importDraw.test.ts` — tests

Steps:

1. Create `src/lib/importDraw.ts` — extract and refactor the import logic from `DrawPrep.svelte`:

```ts
import type { DrawPrepState, DrawSummary } from "./types";
import { save as storageSave, listAll } from "./storage";

export interface ImportResult {
  state: DrawPrepState;
  replaced: boolean;
}

export async function resolveImport(
  file: File,
  computeDrawData: (numGroups: number) => Promise<{
    round: number;
    baseWinnerPositions: number[];
    baseRunnerUpPositions: number[];
    baseByePositions: number[];
  }>,
  buildState: (numGroups: number, groups: any[], drawData: any, eventName: string) => DrawPrepState,
): Promise<ImportResult | null> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate structure
  if (typeof data.numGroups !== 'number' || !Array.isArray(data.groups)) {
    throw new Error('Invalid file: must have numGroups and groups');
  }
  if (data.numGroups !== data.groups.length) {
    throw new Error(`Invalid file: numGroups (${data.numGroups}) does not match groups array length (${data.groups.length})`);
  }
  for (let i = 0; i < data.groups.length; i++) {
    const g = data.groups[i];
    if (!g.winner || typeof g.hasRunnerUp !== 'boolean') {
      throw new Error(`Invalid file: group ${i + 1} is missing winner or hasRunnerUp`);
    }
    if (g.runnerUp != null && (typeof g.runnerUp.na !== 'string' || typeof g.runnerUp.name !== 'string')) {
      throw new Error(`Invalid file: group ${i + 1} runner-up has invalid fields`);
    }
  }

  // Recompute base positions from group count
  const drawData = await computeDrawData(data.numGroups);

  // Validate placed positions within ranges
  const allPositions = [
    ...drawData.baseWinnerPositions,
    ...drawData.baseRunnerUpPositions,
    ...drawData.baseByePositions,
  ];
  const posSet = new Set(allPositions);
  for (let i = 0; i < data.groups.length; i++) {
    const g = data.groups[i];
    if (g.winner.position != null && !posSet.has(g.winner.position)) {
      throw new Error(`Invalid file: group ${i + 1} winner position ${g.winner.position} is out of range`);
    }
    if (g.runnerUp?.position != null && !posSet.has(g.runnerUp.position)) {
      throw new Error(`Invalid file: group ${i + 1} runner-up position ${g.runnerUp.position} is out of range`);
    }
  }

  const importedEventName = (data.eventName || "").trim();

  // Check for name collision
  const existingDraws = listAll();
  const collision = existingDraws.find(d => d.eventName === importedEventName);

  let finalEventName = importedEventName;
  let existingId: string | null = null;

  if (collision) {
    const choice = confirm(`A draw named "${importedEventName}" already exists.\n\nClick OK to replace it, or Cancel to import with a new name.`);
    if (choice) {
      // Replace — reuse the existing ID
      existingId = collision.id;
    } else {
      // Prompt for new name — loop until unique or cancelled
      let newName: string | null = null;
      while (true) {
        newName = prompt(`Enter a new name for the imported draw:`, importedEventName);
        if (newName === null) return null; // user cancelled the whole import
        newName = newName.trim();
        if (!newName) continue; // empty name, re-prompt
        const anotherCollision = existingDraws.find(d => d.eventName === newName);
        if (!anotherCollision) break;
        alert(`A draw named "${newName}" also exists. Please choose a different name.`);
      }
      finalEventName = newName;
    }
  }

  // Build state
  let state: DrawPrepState;
  if (existingId) {
    state = { ...buildState(data.groups.length, data.groups, drawData, finalEventName), id: existingId };
  } else {
    state = buildState(data.groups.length, data.groups, drawData, finalEventName);
  }

  storageSave(state);

  return { state, replaced: !!existingId };
}
```

2. Create `src/lib/importDraw.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveImport } from "./importDraw";
import type { DrawPrepState } from "./types";

// Mock storage
vi.mock("./storage", () => ({
  save: vi.fn(),
  listAll: vi.fn(() => []),
}));

import { save, listAll } from "./storage";

function makeValidFileData(overrides?: Record<string, unknown>) {
  return {
    numGroups: 2,
    groups: [
      { winner: { na: "A", name: "Player A", position: 1 }, hasRunnerUp: true, runnerUp: { na: "B", name: "Player B", position: 4 } },
      { winner: { na: "C", name: "Player C", position: 3 }, hasRunnerUp: true, runnerUp: { na: "D", name: "Player D", position: 2 } },
    ],
    eventName: "Test Event",
    ...overrides,
  };
}

const mockComputeDrawData = vi.fn(() =>
  Promise.resolve({
    round: 4,
    baseWinnerPositions: [1, 4],
    baseRunnerUpPositions: [2, 3],
    baseByePositions: [],
  })
);

function mockBuildState(numGroups: number, groups: any[], drawData: any, eventName: string): DrawPrepState {
  return {
    id: "new-id",
    createdAt: Date.now(),
    numGroups,
    groups,
    eventName,
    ...drawData,
  };
}

function makeFile(data: Record<string, unknown>): File {
  return new File([JSON.stringify(data)], "test.json", { type: "application/json" });
}

describe("resolveImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("prompt", vi.fn(() => null));
    vi.stubGlobal("alert", vi.fn());
  });

  it("imports a valid file with no collision", async () => {
    vi.mocked(listAll).mockReturnValue([]);
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result).not.toBeNull();
    expect(result!.state.eventName).toBe("Test Event");
    expect(result!.replaced).toBe(false);
    expect(save).toHaveBeenCalled();
  });

  it("throws on invalid file missing numGroups", async () => {
    await expect(resolveImport(makeFile({ groups: [] }), mockComputeDrawData, mockBuildState)).rejects.toThrow("Invalid file");
  });

  it("throws on numGroups/groups length mismatch", async () => {
    await expect(
      resolveImport(makeFile(makeValidFileData({ numGroups: 5 })), mockComputeDrawData, mockBuildState)
    ).rejects.toThrow("does not match");
  });

  it("throws on group missing winner", async () => {
    const data = makeValidFileData();
    data.groups[0] = { hasRunnerUp: true };
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("missing winner");
  });

  it("throws on invalid runner-up fields", async () => {
    const data = makeValidFileData();
    data.groups[0].runnerUp = { na: 123, name: "ok" };
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("invalid fields");
  });

  it("throws on winner position out of range", async () => {
    const data = makeValidFileData();
    data.groups[0].winner.position = 999;
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("out of range");
  });

  it("throws on runner-up position out of range", async () => {
    const data = makeValidFileData();
    data.groups[0].runnerUp.position = 999;
    await expect(resolveImport(makeFile(data), mockComputeDrawData, mockBuildState)).rejects.toThrow("out of range");
  });

  it("replaces existing draw when user confirms", async () => {
    vi.mocked(listAll).mockReturnValue([{ id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() }]);
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result!.replaced).toBe(true);
    expect(result!.state.id).toBe("existing-1");
  });

  it("imports with new name when user chooses rename", async () => {
    vi.mocked(listAll).mockReturnValue([{ id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() }]);
    vi.stubGlobal("confirm", vi.fn(() => false)); // choose rename
    vi.stubGlobal("prompt", vi.fn(() => "Renamed Event"));

    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result!.replaced).toBe(false);
    expect(result!.state.eventName).toBe("Renamed Event");
    expect(result!.state.id).toBe("new-id"); // new ID, not existing
  });

  it("re-prompts when renamed name also collides", async () => {
    vi.mocked(listAll).mockReturnValue([
      { id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() },
      { id: "existing-2", eventName: "Colliding Name", numGroups: 2, createdAt: Date.now() },
    ]);
    vi.stubGlobal("confirm", vi.fn(() => false)); // choose rename
    vi.stubGlobal("prompt", vi.fn(() => "Colliding Name"));
    // alert should be called, then prompt returns null (cancel)
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result).toBeNull(); // user cancelled after failed rename
    expect(alert).toHaveBeenCalledWith(expect.stringContaining("also exists"));
  });

  it("returns null when user cancels the whole import", async () => {
    vi.mocked(listAll).mockReturnValue([{ id: "existing-1", eventName: "Test Event", numGroups: 2, createdAt: Date.now() }]);
    vi.stubGlobal("confirm", vi.fn(() => false)); // choose rename
    vi.stubGlobal("prompt", vi.fn(() => null)); // cancel prompt
    const result = await resolveImport(makeFile(makeValidFileData()), mockComputeDrawData, mockBuildState);
    expect(result).toBeNull();
  });

  it("defaults eventName to empty string when not in file", async () => {
    vi.mocked(listAll).mockReturnValue([]);
    const data = makeValidFileData();
    delete data.eventName;
    const result = await resolveImport(makeFile(data), mockComputeDrawData, mockBuildState);
    expect(result!.state.eventName).toBe("");
  });
});
```

3. Run tests — confirm they fail:

```bash
npx vitest run src/lib/importDraw.test.ts
```

⏸ **CHECKPOINT: test** — present test review. Wait for human approval before implementing.

4. Run tests — confirm they pass. If any fail, fix the implementation (not the tests — tests are the spec).

```bash
npx vitest run src/lib/importDraw.test.ts
```

5. Update `src/pages/DrawPrep.svelte` to use `resolveImport` instead of inline import logic:

Add import:

```js
import { resolveImport } from "../lib/importDraw";
```

Replace the existing `importDraw` function with:

```js
let importFileInput;

function triggerFileImport() {
  importFileInput.click();
}

async function handleImportFromList(file) {
  error = '';
  try {
    const result = await resolveImport(file, computeDrawData, buildState);
    if (!result) return; // user cancelled
    state = { ...result.state, ...(await computeDrawData(result.state.groups.length)) };
    push(`/draw-prep/draw/${result.state.id}`);
  } catch (e) {
    error = e.message || 'Failed to import';
  }
}

function onFileSelected(e) {
  const file = e.target.files[0];
  if (file) handleImportFromList(file);
  e.target.value = '';
}
```

Remove the old `importDraw`, `onSetupFileSelected`, and their associated file inputs. Add a hidden file input at the bottom of the list view template:

```svelte
<input bind:this={importFileInput} type="file" accept=".json" class="hidden" onchange={onFileSelected} />
```

Pass `onImport={handleImportFromList}` and `onTriggerFileImport={triggerFileImport}` to `DrawList`.

6. Run all tests:

```bash
npx vitest run
```

---

## Task 3: Update DrawList — always-visible Import, drag on non-empty list

<!-- tdd: new-feature -->
<!-- checkpoint: done -->

Files:
- `src/components/DrawList.svelte` — add Import button to header, move drag handlers to outer div
- `src/components/DrawPrepGroups.svelte` — remove Import button and file input
- `src/components/DrawPrepGroups.test.ts` — update tests (remove onImport prop assertions)

Steps:

1. Update `src/components/DrawList.svelte`:

- Add `onTriggerFileImport` prop:

```js
let {
  draws = [],
  onOpen,
  onNew,
  onDelete,
  onImport,
  onTriggerFileImport,
} = $props();
```

- Add Import button to the header bar (always visible):

```svelte
<div class="flex items-center justify-between mb-4">
  <h2 class="text-lg font-medium">My Draws</h2>
  <div class="flex gap-2">
    <Btn cls="bg-gray-500 text-white" onclick={() => onTriggerFileImport?.()}>Import</Btn>
    <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>+ New Draw</Btn>
  </div>
</div>
```

- Move drag handlers from the empty-state inner div to the outer `<div>`. The outer div wraps everything:

```svelte
<div
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <!-- header with Import + New Draw -->
  {#if draws.length === 0}
    <!-- empty state (simplified, no import/drop zone needed since outer div handles it) -->
    <div class="text-center py-12 px-6 rounded-lg border-2 border-dashed ...">
      <p class="text-4xl mb-3">📄</p>
      <p class="text-lg mb-2">No draws yet</p>
      <p class="text-sm mb-4">Drag & drop a .json file here, or use the Import button above</p>
    </div>
  {:else}
    <!-- grid of draws (unchanged) -->
  {/if}
</div>
```

- Remove the Import and New Draw buttons from the empty-state inner content (they're now in the header).

- Remove the hidden file input from `DrawList` — it's now managed by `DrawPrep.svelte`.

2. Update `src/components/DrawPrepGroups.svelte`:

- Remove the `onImport` prop.
- Remove the `fileInput`, `triggerImport`, and `onFileSelected` functions.
- Remove the hidden `<input>` element.
- Remove the Import `<Btn>` from the action buttons. Keep only Export:

```svelte
<div class="flex gap-3 mt-4 px-1">
  <Btn cls="bg-blue-500 text-white" onclick={() => onExport?.()}>Export</Btn>
</div>
```

3. Update `src/components/DrawPrepGroups.test.ts`:

- Remove `onImport: vi.fn()` from all test props.
- Remove any test that asserts on the Import button (if any).
- Run tests:

```bash
npx vitest run src/components/DrawPrepGroups.test.ts
```

4. Run all tests:

```bash
npx vitest run
```

⏸ **CHECKPOINT: done** — present implementation review. Wait for human approval before committing.

---

## Task 4: Final wiring and manual verification

<!-- tdd: trivial -->

Files:
- `src/pages/DrawPrep.svelte` — ensure template passes correct props to DrawList
- `src/App.svelte` — verify routes

Steps:

1. Verify `DrawPrep.svelte` passes `onTriggerFileImport` to `DrawList`:

```svelte
<DrawList {draws} onOpen={openDraw} onNew={newDraw} onDelete={deleteDraw} onImport={handleImportFromList} onTriggerFileImport={triggerFileImport} />
```

2. Verify `DrawPrepGroups` no longer receives `onImport` — update the call in the editing template:

```svelte
<DrawPrepGroups
  groups={state.groups}
  availableWinnerPositions={availableWinnerPositions}
  availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
  onChange={handleGroupsChange}
  onExport={exportDraw}
/>
```

3. Build and verify:

```bash
npx vite build
```

Should succeed with no errors.

4. Run all tests:

```bash
npx vitest run
```

All tests pass.

5. Manual test checklist (run `npx vite dev`):
   - Navigate to `#/draw-prep` → list shows
   - Click "+ New Draw" → inline setup form appears
   - Fill name + groups, confirm → navigates to `#/draw-prep/draw/{id}`
   - Hit browser back → returns to list
   - Click a draw card → navigates to `#/draw-prep/draw/{id}`
   - Hit browser back → returns to list
   - Import a draw with unique name → added to list, navigates to it
   - Import a draw with existing name → prompt for replace or rename
   - Drag & drop a file on non-empty list → imports
   - Import button in header works
   - No Import button in editing view (DrawPrepGroups)
   - Export button still works in editing view

# Draw Empty State & Delete UX — Implementation Plan

## Task 1: Move delete button from DrawPrepGroups to DrawPrep top bar

<!-- tdd: modifying-tested-code -->

Files:
- `web/src/components/DrawPrepGroups.svelte` — remove `onReset` prop and Reset button
- `web/src/components/DrawPrepGroups.test.ts` — update tests
- `web/src/pages/DrawPrep.svelte` — add trash icon to back-link bar, remove `onReset` from `<DrawPrepGroups>`, update confirm text

Steps:

1. Run existing tests to confirm baseline:
   ```bash
   cd /Volumes/Ext/code/personal/sttacomp/web && npx vitest run src/components/DrawPrepGroups.test.ts
   ```
   → 3 tests pass.

2. In `DrawPrepGroups.svelte`, remove `onReset` from props and remove the Reset button:

   **Props** — remove `onReset`:
   ```diff
     let {
       groups = [],
       availableWinnerPositions = [],
       availableRunnerUpPositionsPerGroup = [],
       onChange,
       onExport,
       onImport,
   -   onReset,
     } = $props();
   ```

   **Template** — remove the Reset button line:
   ```diff
     <div class="flex gap-3 mt-4 px-1">
       <Btn cls="bg-blue-500 text-white" onclick={() => onExport?.()}>Export</Btn>
       <Btn cls="bg-gray-500 text-white" onclick={triggerImport}>Import</Btn>
   -   <Btn cls="bg-red-700 text-white" onclick={() => onReset?.()}>Reset</Btn>
     </div>
   ```

3. In `DrawPrep.svelte`, update `resetDraw()` confirm text:
   ```diff
   - if (!confirm('Reset will clear all data. Continue?')) return;
   + if (!confirm('Delete this draw? This cannot be undone.')) return;
   ```

4. In `DrawPrep.svelte`, replace the back-link bar in the editing view:
   ```diff
   -    <div class="flex items-center mx-2 mb-2">
   -      <button
   -        class="text-sm text-red-600 hover:text-red-800 font-medium"
   -        onclick={backToList}
   -      >
   -        ← Back to My Draws
   -      </button>
   -    </div>
   +    <div class="flex items-center justify-between mx-2 mb-2">
   +      <button
   +        class="text-sm text-red-600 hover:text-red-800 font-medium"
   +        onclick={backToList}
   +      >
   +        ← Back to My Draws
   +      </button>
   +      <button
   +        class="text-gray-400 hover:text-red-500 transition-colors"
   +        onclick={resetDraw}
   +        title="Delete draw"
   +      >
   +        🗑
   +      </button>
   +    </div>
   ```

5. In `DrawPrep.svelte`, remove `onReset` from the `<DrawPrepGroups>` call:
   ```diff
          <DrawPrepGroups
            groups={state.groups}
            availableWinnerPositions={availableWinnerPositions}
            availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
            onChange={handleGroupsChange}
            onExport={exportDraw}
            onImport={importDraw}
   -        onReset={resetDraw}
          />
   ```

6. Update `DrawPrepGroups.test.ts` — remove the Reset test and remove `onReset` from all other test props:

   Remove the entire `it("fires onReset when Reset button clicked", ...)` test block.

   In the remaining two tests, remove `onReset: vi.fn()` from the props objects:
   ```diff
     // In "renders one GroupCard per group" test:
   -        onReset: vi.fn(),
   
     // In "fires onExport when Export button clicked" test:
   -        onReset: vi.fn(),
   ```

7. Run tests:
   ```bash
   cd /Volumes/Ext/code/personal/sttacomp/web && npx vitest run src/components/DrawPrepGroups.test.ts
   ```
   → 2 tests pass (Reset test removed, others pass without `onReset` prop).

8. Run full test suite:
   ```bash
   cd /Volumes/Ext/code/personal/sttacomp/web && npx vitest run
   ```
   → All tests pass.

---

## Task 2: Always show "My Draws" list (remove empty-state skip)

<!-- tdd: trivial -->

Files:
- `web/src/pages/DrawPrep.svelte` — change `onMount` and `backToList` to always use `list`

Steps:

1. In `DrawPrep.svelte`, update `onMount` to always show `list`:
   ```diff
   -  // On mount: load draw list, show list (or setup if empty)
   +  // On mount: load draw list
     onMount(async () => {
       draws = listAll();
   -    if (draws.length === 0) {
   -      view = 'setup';
   -    }
     });
   ```

2. Update `backToList()` to always show `list`:
   ```diff
     function backToList() {
       state = null;
       confirmed = false;
       draws = listAll();
   -    view = draws.length > 0 ? 'list' : 'setup';
   +    view = 'list';
     }
   ```

3. Run full test suite:
   ```bash
   cd /Volumes/Ext/code/personal/sttacomp/web && npx vitest run
   ```
   → All tests pass. No behavior change for existing tests.

---

## Task 3: Add drop zone + import to DrawList empty state

<!-- tdd: trivial -->

Files:
- `web/src/components/DrawList.svelte` — add `onImport` prop, replace empty state with drop zone
- `web/src/pages/DrawPrep.svelte` — pass `onImport` to `<DrawList>`

Steps:

1. In `DrawList.svelte`, add `onImport` prop:
   ```diff
     let {
       draws = [],
       onOpen,
       onNew,
       onDelete,
   +   onImport,
     } = $props();
   ```

2. Add drop zone state and handlers after the existing `handleDelete` function:
   ```js
   let isDragOver = $state(false);
   let dragCounter = 0; // track enter/leave to avoid child-element flicker
   let fileInput;

   function handleDragEnter(e) {
     e.preventDefault();
     dragCounter++;
     isDragOver = true;
   }

   function handleDragOver(e) {
     e.preventDefault();
   }

   function handleDragLeave(e) {
     e.preventDefault();
     dragCounter--;
     if (dragCounter === 0) isDragOver = false;
   }

   function handleDrop(e) {
     e.preventDefault();
     isDragOver = false;
     dragCounter = 0;
     const file = e.dataTransfer?.files[0];
     if (file) {
       onImport?.(file);
     }
   }

   function triggerFileImport() {
     fileInput.click();
   }

   function onFileSelected(e) {
     const file = e.target.files[0];
     if (file) onImport?.(file);
     e.target.value = '';
   }
   ```

3. Replace the empty-state block in the template. Change from:
   ```svelte
   {#if draws.length === 0}
     <div class="text-center py-12 text-gray-500">
       <p class="text-lg mb-4">No draws yet</p>
       <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>Create your first draw</Btn>
     </div>
   ```
   To:
   ```svelte
   {#if draws.length === 0}
     <div
       class="text-center py-12 px-6 rounded-lg border-2 border-dashed transition-colors {isDragOver
         ? 'border-blue-400 bg-blue-50 text-blue-600'
         : 'border-gray-300 text-gray-500'}"
       ondragenter={handleDragEnter}
       ondragover={handleDragOver}
       ondragleave={handleDragLeave}
       ondrop={handleDrop}
     >
       <p class="text-4xl mb-3">📄</p>
       <p class="text-lg mb-2">No draws yet</p>
       <p class="text-sm mb-4">Drag & drop a .json file here</p>
       <div class="flex items-center justify-center gap-3">
         <Btn cls="bg-gray-500 text-white" onclick={triggerFileImport}>Import Draw</Btn>
         <span class="text-gray-400 text-sm">or</span>
         <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>+ New Draw</Btn>
       </div>
     </div>
     <!-- Hidden file input -->
     <input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={onFileSelected} />
   ```

4. In `DrawPrep.svelte`, pass `onImport` to the `<DrawList>` component:
   ```diff
   -    <DrawList {draws} onOpen={openDraw} onNew={newDraw} onDelete={deleteDraw} />
   +    <DrawList {draws} onOpen={openDraw} onNew={newDraw} onDelete={deleteDraw} onImport={importDraw} />
   ```

5. Run full test suite:
   ```bash
   cd /Volumes/Ext/code/personal/sttacomp/web && npx vitest run
   ```
   → All tests pass.

6. Build to verify no Svelte compiler errors:
   ```bash
   cd /Volumes/Ext/code/personal/sttacomp/web && npx vite build
   ```
   → Build succeeds.

# Modernize Toolchain — Implementation Plan

Design doc: `docs/plans/2026-05-09-modernize-toolchain-design.md`

## Overview

13 tasks to upgrade the sttacomp frontend: remove svetamat, upgrade to Svelte 5 + Tailwind 4 + Vite 6, migrate all components to runes, and add component tests.

**Execution order matters** — each task builds on the previous. Svelte 5 runs all existing Svelte 3 syntax in "legacy mode" until we migrate each file, so the app stays functional throughout.

---

## Task 1: Verify baseline

<!-- tdd: trivial -->

Verify all existing tests pass and the app builds before making any changes.

Steps:
1. Run `cd web && npm ci` to install current dependencies
2. Run `cd web && npx vitest run` — all existing tests should pass:
   - `web/src/lib/draw.test.ts` — draw calculation tests
   - `web/src/lib/positions.test.ts` — position logic tests
   - `web/src/lib/storage.test.ts` — localStorage tests
   - `web/src/lib/exportFilename.test.ts` — filename formatting tests
3. Run `cd web && npm run build` — should succeed
4. Record the test count and build output for reference

Expected: ~30+ tests passing, clean build with no warnings.

---

## Task 2: Replace elevation classes with shadow utilities

<!-- tdd: trivial -->

Replace all `elevation-N` classes (from `tailwindcss-elevation` plugin) with Tailwind's built-in `shadow-*` utilities. This is a prerequisite for removing the elevation plugin.

Mapping: `elevation-3` → `shadow-md`, `elevation-4` → `shadow-lg`

Files to modify:

**`web/src/App.svelte`** — line 17:
```
elevation-4 → shadow-lg
```

**`web/src/pages/Draw.svelte`** — 5 occurrences of `elevation-3` → `shadow-md`:
- Line 108: `elevation-3 bg-blue-100`
- Line 115: `elevation-3 bg-green-100`
- Line 140: `elevation-3 bg-orange-100`
- Line 155: `elevation-3 bg-gray-200`
- Line 173: `elevation-3 bg-red-100`

**`web/src/pages/DrawPrep.svelte`** — 2 occurrences of `elevation-3` → `shadow-md`:
- Line 283: `elevation-3 bg-white`
- Line 334: `elevation-3 bg-white`

Then remove the `tailwindcss-elevation` plugin:

**`web/tailwind.config.js`** — remove the plugin:
```js
// Before
plugins: [
  require('tailwindcss-elevation')(['responsive', 'hover', 'active']),
]

// After
plugins: []
```

**`web/package.json`** — remove from devDependencies:
```
"tailwindcss-elevation": "^0.3.3"
```

Steps:
1. Edit the 3 files to replace all `elevation-3` → `shadow-md` and `elevation-4` → `shadow-lg`
2. Remove `tailwindcss-elevation` from `tailwind.config.js` plugins and `package.json`
3. Run `cd web && npm install` to update lockfile
4. Run `cd web && npm run build` — should succeed
5. Run `cd web && npx vitest run` — all tests pass

---

## Task 3: Full toolchain upgrade (Svelte 5 + Vite 6 + Tailwind 4)

<!-- tdd: trivial -->
<!-- checkpoint: done -->

Upgrade all core toolchain dependencies at once. Svelte 5's legacy mode keeps existing Svelte 3 syntax working.

### Step 1: Install new dependencies

```bash
cd web
npm install -D svelte@^5 @sveltejs/vite-plugin-svelte@^5 vite@^6 tailwindcss@^4 @tailwindcss/vite@^4
npm uninstall svetamat autoprefixer postcss svelte-preprocess
npm install -D @testing-library/svelte jsdom
```

Note: `svelte-preprocess` is removed. Svelte 5 uses `vitePreprocess()` from the vite plugin. `vitest` stays at its current version (^4.1.5) — it's already recent enough.

### Step 2: Update `web/vite.config.js`

Replace entire file:
```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
});
```

### Step 3: Create `web/svelte.config.js`

New file — needed by svelte-check and the vite plugin:
```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess() };
```

### Step 4: Update `web/src/global.css`

Replace entire file with:
```css
@import "tailwindcss";

@theme {
  --color-gray-150: #d4d4d8;
}

/* Material Icons */
@font-face {
  font-family: "Material Icons";
  font-style: normal;
  font-weight: 400;
  src: url(/fonts/MaterialIcons-Regular.eot);
  src: local("Material Icons"), local("MaterialIcons-Regular"),
    url(/fonts/MaterialIcons-Regular.woff2) format("woff2"),
    url(/fonts/MaterialIcons-Regular.woff) format("woff"),
    url(/fonts/MaterialIcons-Regular.ttf) format("truetype");
  font-display: swap;
}
.material-icons {
  font-family: "Material Icons";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "liga";
}

/* Ripple */
.ripple {
  position: relative;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
}
.ripple:after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #000 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}
.ripple:active:after {
  transform: scale(0, 0);
  opacity: 0.2;
  transition: 0s;
}

/* Roboto fonts */
@font-face { font-family: "Roboto"; font-style: normal; font-weight: 100; src: url("/fonts/roboto-v20-latin-100.eot"); src: local("Roboto Thin"), local("Roboto-Thin"), url("/fonts/roboto-v20-latin-100.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-100.woff2") format("woff2"), url("/fonts/roboto-v20-latin-100.woff") format("woff"), url("/fonts/roboto-v20-latin-100.ttf") format("truetype"), url("/fonts/roboto-v20-latin-100.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: italic; font-weight: 100; src: url("/fonts/roboto-v20-latin-100italic.eot"); src: local("Roboto Thin Italic"), local("Roboto-ThinItalic"), url("/fonts/roboto-v20-latin-100italic.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-100italic.woff2") format("woff2"), url("/fonts/roboto-v20-latin-100italic.woff") format("woff"), url("/fonts/roboto-v20-latin-100italic.ttf") format("truetype"), url("/fonts/roboto-v20-latin-100italic.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: normal; font-weight: 300; src: url("/fonts/roboto-v20-latin-300.eot"); src: local("Roboto Light"), local("Roboto-Light"), url("/fonts/roboto-v20-latin-300.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-300.woff2") format("woff2"), url("/fonts/roboto-v20-latin-300.woff") format("woff"), url("/fonts/roboto-v20-latin-300.ttf") format("truetype"), url("/fonts/roboto-v20-latin-300.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: italic; font-weight: 300; src: url("/fonts/roboto-v20-latin-300italic.eot"); src: local("Roboto Light Italic"), local("Roboto-LightItalic"), url("/fonts/roboto-v20-latin-300italic.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-300italic.woff2") format("woff2"), url("/fonts/roboto-v20-latin-300italic.woff") format("woff"), url("/fonts/roboto-v20-latin-300italic.ttf") format("truetype"), url("/fonts/roboto-v20-latin-300italic.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: normal; font-weight: 400; src: url("/fonts/roboto-v20-latin-regular.eot"); src: local("Roboto"), local("Roboto-Regular"), url("/fonts/roboto-v20-latin-regular.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-regular.woff2") format("woff2"), url("/fonts/roboto-v20-latin-regular.woff") format("woff"), url("/fonts/roboto-v20-latin-regular.ttf") format("truetype"), url("/fonts/roboto-v20-latin-regular.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: italic; font-weight: 400; src: url("/fonts/roboto-v20-latin-italic.eot"); src: local("Roboto Italic"), local("Roboto-Italic"), url("/fonts/roboto-v20-latin-italic.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-italic.woff2") format("woff2"), url("/fonts/roboto-v20-latin-italic.woff") format("woff"), url("/fonts/roboto-v20-latin-italic.ttf") format("truetype"), url("/fonts/roboto-v20-latin-italic.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: normal; font-weight: 500; src: url("/fonts/roboto-v20-latin-500.eot"); src: local("Roboto Medium"), local("Roboto-Medium"), url("/fonts/roboto-v20-latin-500.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-500.woff2") format("woff2"), url("/fonts/roboto-v20-latin-500.woff") format("woff"), url("/fonts/roboto-v20-latin-500.ttf") format("truetype"), url("/fonts/roboto-v20-latin-500.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: italic; font-weight: 500; src: url("/fonts/roboto-v20-latin-500italic.eot"); src: local("Roboto Medium Italic"), local("Roboto-MediumItalic"), url("/fonts/roboto-v20-latin-500italic.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-500italic.woff2") format("woff2"), url("/fonts/roboto-v20-latin-500italic.woff") format("woff"), url("/fonts/roboto-v20-latin-500italic.ttf") format("truetype"), url("/fonts/roboto-v20-latin-500italic.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: normal; font-weight: 700; src: url("/fonts/roboto-v20-latin-700.eot"); src: local("Roboto Bold"), local("Roboto-Bold"), url("/fonts/roboto-v20-latin-700.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-700.woff2") format("woff2"), url("/fonts/roboto-v20-latin-700.woff") format("woff"), url("/fonts/roboto-v20-latin-700.ttf") format("truetype"), url("/fonts/roboto-v20-latin-700.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: italic; font-weight: 700; src: url("/fonts/roboto-v20-latin-700italic.eot"); src: local("Roboto Bold Italic"), local("Roboto-BoldItalic"), url("/fonts/roboto-v20-latin-700italic.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-700italic.woff2") format("woff2"), url("/fonts/roboto-v20-latin-700italic.woff") format("woff"), url("/fonts/roboto-v20-latin-700italic.ttf") format("truetype"), url("/fonts/roboto-v20-latin-700italic.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: normal; font-weight: 900; src: url("/fonts/roboto-v20-latin-900.eot"); src: local("Roboto Black"), local("Roboto-Black"), url("/fonts/roboto-v20-latin-900.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-900.woff2") format("woff2"), url("/fonts/roboto-v20-latin-900.woff") format("woff"), url("/fonts/roboto-v20-latin-900.ttf") format("truetype"), url("/fonts/roboto-v20-latin-900.svg#Roboto") format("svg"); font-display: swap; }
@font-face { font-family: "Roboto"; font-style: italic; font-weight: 900; src: url("/fonts/roboto-v20-latin-900italic.eot"); src: local("Roboto Black Italic"), local("Roboto-BlackItalic"), url("/fonts/roboto-v20-latin-900italic.eot?#iefix") format("embedded-opentype"), url("/fonts/roboto-v20-latin-900italic.woff2") format("woff2"), url("/fonts/roboto-v20-latin-900italic.woff") format("woff"), url("/fonts/roboto-v20-latin-900italic.ttf") format("truetype"), url("/fonts/roboto-v20-latin-900italic.svg#Roboto") format("svg"); font-display: swap; }

body {
  margin: 0;
  font-family: Roboto;
  min-height: 100vh;
}
```

Note: The `@tailwind base/components/utilities` directives are replaced by `@import "tailwindcss"`. The `@theme` block replaces the `tailwind.config.js` theme extension. All font-face and custom CSS is preserved for now (cleaned up in Task 4).

### Step 5: Delete obsolete config files

Delete:
- `web/tailwind.config.js`
- `web/postcss.config.js`

### Step 6: Update `web/src/main.js`

Svelte 5 uses `mount()` instead of `new Component()`:
```js
import './global.css';
import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.body,
});

export default app;
```

### Step 7: Verify

1. Run `cd web && npm run build` — should succeed
2. Run `cd web && npx vitest run` — all lib tests pass
3. Verify the app renders in browser (Svelte 5 legacy mode runs all Svelte 3 syntax)

⏸ **CHECKPOINT: done** — Verify the app renders correctly and all tests pass before proceeding. This is the riskiest single task since it upgrades 3 major dependencies at once.

---

## Task 4: Fonts cleanup

<!-- tdd: trivial -->

Replace self-hosted font files with Google Fonts CDN. Keep `favicon.png`.

**`web/index.html`** — add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

**`web/src/global.css`** — remove ALL `@font-face` blocks (Roboto and Material Icons) and the `.material-icons` class. Keep only:
```css
@import "tailwindcss";

@theme {
  --color-gray-150: #d4d4d8;
}

/* Ripple */
.ripple {
  position: relative;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
}
.ripple:after {
  content: "";
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #000 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform 0.5s, opacity 1s;
}
.ripple:active:after {
  transform: scale(0, 0);
  opacity: 0.2;
  transition: 0s;
}

body {
  margin: 0;
  font-family: 'Roboto', sans-serif;
  min-height: 100vh;
}
```

**Delete font files**: Remove all files in `web/public/fonts/` directory (keep the directory itself or delete it — it's empty now).

Steps:
1. Edit `web/index.html` to add Google Fonts links
2. Edit `web/src/global.css` to remove font-face blocks and material-icons class
3. Delete all files in `web/public/fonts/`
4. Run `cd web && npm run build` — should succeed
5. Verify in browser: Roboto font loads, Material Icons error icon in Draw.svelte renders

---

## Task 5: Remove svetamat — create Btn.svelte and replace all usages

<!-- tdd: trivial -->
<!-- checkpoint: done -->

svetamat was uninstalled in Task 3 but its imports still exist. We replace all 4 components (Button, Input, Checkbox, Spinner) with plain HTML + a thin `Btn.svelte` helper.

### Step 1: Create `web/src/components/Btn.svelte`

New file — Svelte 3 syntax (will be migrated to runes later):
```svelte
<script>
  export let cls = "";
  export let disabled = false;
</script>

<button
  class="focus:outline-none uppercase tracking-wide h-8 px-4 rounded shadow-sm hover:shadow-md active:shadow-none transition-shadow ripple disabled:opacity-25 disabled:cursor-not-allowed {cls}"
  {disabled}
  on:click
>
  <slot></slot>
</button>
```

### Step 2: Replace svetamat in `web/src/pages/Draw.svelte`

Replace the import:
```js
// Remove: import { Input, Button, Checkbox, Spinner } from "svetamat";
// Add:
import Btn from "../components/Btn.svelte";
```

Replace Input components (lines 83-91):
```svelte
<!-- Before: <Input number outlined on:keyup={calculate} label="..." bind:value={winners} /> -->
<!-- After: -->
<div>
  <label class="block text-gray-700 text-sm mb-1">Total no. of winners</label>
  <input
    type="number"
    class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
    bind:value={winners}
    on:keyup={calculate}
  />
</div>
```
And the same pattern for "Total no. of runner-ups" / `bind:value={runnerups}`.

Replace Button (line 102):
```svelte
<!-- Before: <Button bgColor="bg-red-500" textColor="text-white" on:click={calculate}>Calculate</Button> -->
<!-- After: -->
<Btn cls="bg-red-500 text-white" on:click={calculate}>Calculate</Btn>
```

Replace Spinner (line 110):
```svelte
<!-- Before: <Spinner /> -->
<!-- After: -->
<div class="h-8 w-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
```

Replace Checkbox (line 122):
```svelte
<!-- Before: <Checkbox label="Ascending" color="text-orange-600" bind:checked={sorted} /> -->
<!-- After: -->
<label class="flex items-center cursor-pointer text-orange-600">
  <input type="checkbox" class="mr-1.5" bind:checked={sorted} />
  <span>Ascending</span>
</label>
```

### Step 3: Replace svetamat in `web/src/pages/DrawPrep.svelte`

Replace the import:
```js
// Remove: import { Button } from "svetamat";
// Add:
import Btn from "../components/Btn.svelte";
```

Replace the two Button usages:
```svelte
<!-- Before: <Button bgColor="bg-red-500" textColor="text-white" on:click={confirmGroups}>Confirm</Button> -->
<Btn cls="bg-red-500 text-white" on:click={confirmGroups}>Confirm</Btn>

<!-- Before: <Button bgColor="bg-gray-500" textColor="text-white" on:click={() => fileInput.click()}>Import</Button> -->
<Btn cls="bg-gray-500 text-white" on:click={() => fileInput.click()}>Import</Btn>
```

### Step 4: Replace svetamat in `web/src/components/DrawPrepGroups.svelte`

Replace the import:
```js
// Remove: import { Button } from "svetamat";
// Add:
import Btn from "./Btn.svelte";
```

Replace the three Button usages:
```svelte
<!-- Before: <Button bgColor="bg-blue-500" textColor="text-white" on:click={() => dispatch("export")}>Export</Button> -->
<Btn cls="bg-blue-500 text-white" on:click={() => dispatch("export")}>Export</Btn>

<!-- Before: <Button bgColor="bg-gray-500" textColor="text-white" on:click={triggerImport}>Import</Button> -->
<Btn cls="bg-gray-500 text-white" on:click={triggerImport}>Import</Btn>

<!-- Before: <Button bgColor="bg-red-700" textColor="text-white" on:click={() => dispatch("reset")}>Reset</Button> -->
<Btn cls="bg-red-700 text-white" on:click={() => dispatch("reset")}>Reset</Btn>
```

### Step 5: Verify

1. Run `cd web && npm run build` — should succeed with zero references to svetamat
2. Run `cd web && npx vitest run` — all tests pass
3. Grep to confirm no svetamat references remain: `grep -r "svetamat" web/src/` returns nothing

⏸ **CHECKPOINT: done** — Verify all buttons render correctly and are clickable, inputs work, checkbox toggles, spinner shows during calculation.

---

## Task 6: Migrate App.svelte, Logo.svelte, and Btn.svelte to runes

<!-- tdd: modifying-tested-code -->

Simple components to migrate first. These have no inter-component events, making them safe warm-ups.

### `web/src/components/Logo.svelte`

No `<script>` changes needed — Logo is a pure SVG with no props or state. No migration required.

### `web/src/App.svelte`

Replace entire file:
```svelte
<script>
  import Logo from "./components/Logo.svelte";
  import Draw from "./pages/Draw.svelte";
  import DrawPrep from "./pages/DrawPrep.svelte";

  const pages = {
    draw: Draw,
    drawPrep: DrawPrep,
  };

  let selectedPage = $state("draw");
  let component = $derived(pages[selectedPage]);
</script>

<div
  class="h-12 shadow-lg bg-red-600 flex justify-between items-center pl-4 md:pl-6 pr-3">
  <h1 class="text-white font-bold text-lg flex items-center">
    <Logo />
    <span class="hidden sm:inline">Table Tennis Draw Helper</span>
    <span class="sm:hidden text-base">TT Draw</span>
  </h1>
  <div class="flex h-full">
    <button
      class="h-full text-white ripple focus:outline-none px-3 border-b-2 {selectedPage === 'draw'
        ? 'border-white bg-red-700'
        : 'border-transparent bg-red-600'}"
      onclick={() => (selectedPage = "draw")}>
      <span class="hidden sm:inline">Draw Positions</span>
      <span class="sm:hidden text-sm">Positions</span>
    </button>
    <button
      class="h-full text-white ripple focus:outline-none px-3 border-b-2 {selectedPage === 'drawPrep'
        ? 'border-white bg-red-700'
        : 'border-transparent bg-red-600'}"
      onclick={() => (selectedPage = "drawPrep")}>
      <span class="hidden sm:inline">Do Draw</span>
      <span class="sm:hidden text-sm">Draw</span>
    </button>
  </div>
</div>
{@const Component = component}
<Component />
```

Key changes: `let selectedPage = "draw"` → `$state("draw")`, `$: component = ...` → `$derived(...)`, `on:click` → `onclick`, `<svelte:component>` → `{@const Component = component}<Component />`.

### `web/src/components/Btn.svelte`

Replace entire file:
```svelte
<script>
  let { cls = "", disabled = false, onclick, children } = $props();
</script>

<button
  class="focus:outline-none uppercase tracking-wide h-8 px-4 rounded shadow-sm hover:shadow-md active:shadow-none transition-shadow ripple disabled:opacity-25 disabled:cursor-not-allowed {cls}"
  {disabled}
  {onclick}
>
  {@render(children())}
</button>
```

Key changes: `export let` → `$props()`, `on:click` forwarding → `onclick` prop, `<slot>` → `{@render(children())}`.

### Update callers to use `onclick` instead of `on:click`

In `web/src/pages/Draw.svelte`, `web/src/pages/DrawPrep.svelte`, and `web/src/components/DrawPrepGroups.svelte` — change all `<Btn on:click={fn}>` to `<Btn onclick={fn}>`:

**Draw.svelte**:
```svelte
<!-- Before: <Btn cls="bg-red-500 text-white" on:click={calculate}>Calculate</Btn> -->
<Btn cls="bg-red-500 text-white" onclick={calculate}>Calculate</Btn>
```

**DrawPrep.svelte**:
```svelte
<Btn cls="bg-red-500 text-white" onclick={confirmGroups}>Confirm</Btn>
<Btn cls="bg-gray-500 text-white" onclick={() => fileInput.click()}>Import</Btn>
```

**DrawPrepGroups.svelte**:
```svelte
<Btn cls="bg-blue-500 text-white" onclick={() => dispatch("export")}>Export</Btn>
<Btn cls="bg-gray-500 text-white" onclick={triggerImport}>Import</Btn>
<Btn cls="bg-red-700 text-white" onclick={() => dispatch("reset")}>Reset</Btn>
```

Steps:
1. Migrate `App.svelte` (replace entire file)
2. Migrate `Btn.svelte` (replace entire file)
3. Update Btn callers in 3 files: `on:click` → `onclick`
4. Run `cd web && npm run build` — should succeed
5. Run `cd web && npx vitest run` — all tests pass

---

## Task 7: Migrate SplitDraw.svelte and DrawPrepChart.svelte to runes

<!-- tdd: modifying-tested-code -->

Display-only components (props in, no events out). Straightforward migration.

### `web/src/components/SplitDraw.svelte`

Replace the `<script>` section only (markup unchanged):
```svelte
<script>
  let { round = 1, players = [] } = $props();

  let columnCount = $derived(round <= 64 ? 2 : 4);
  let positionsPerColumn = $derived(round / columnCount);

  // ... all helper functions stay exactly the same (pure functions, no reactivity):
  function extractLabel(raw, pos) { ... }
  function playerType(raw) { ... }
  function isMiddleGroup(eighthIndex, groupIndex) { ... }
  function buildPlayer(pos, players) { ... }
  function buildGroup(startPos, players) { ... }
  function buildEighth(startPos, players) { ... }
  function buildQuarter(startPos, players) { ... }
  function buildColumn(columnIndex, positionsPerColumn, columnCount, players) { ... }

  let columns = $derived(
    Array.from({ length: columnCount }, (_, c) =>
      buildColumn(c, positionsPerColumn, columnCount, players)
    )
  );
</script>
```

Key changes: `export let` → `$props()`, `$: columnCount = ...` → `$derived(...)`, `$: columns = ...` → `$derived(...)`. All helper functions are pure and unchanged.

### `web/src/components/DrawPrepChart.svelte`

Replace the `<script>` section:
```svelte
<script>
  let {
    round = 1,
    winners = [],
    runnerups = [],
    byes = [],
    placedPlayers = new Map(),
  } = $props();

  let columnCount = $derived(round <= 64 ? 2 : 4);
  let positionsPerColumn = $derived(round / columnCount);

  let allPositions = $derived(Array.from({ length: round }, (_, i) => i + 1));

  let players = $derived(
    allPositions.map(pos => {
      const placed = placedPlayers.get(pos);
      if (placed) return `${pos}: ${placed.label || placed.name}`;
      if (byes.includes(pos)) return `${pos}: BYE`;
      if (winners.includes(pos)) return `${pos}: Winner`;
      if (runnerups.includes(pos)) return `${pos}: Runner-up`;
      return String(pos);
    })
  );

  // All helper functions stay exactly the same:
  function extractLabel(raw, pos) { ... }
  function playerType(raw, pos) { ... }
  function isMiddleGroup(eighthIndex, groupIndex) { ... }
  function buildPlayer(pos, players) { ... }
  function buildGroup(startPos, players) { ... }
  function buildEighth(startPos, players) { ... }
  function buildQuarter(startPos, players) { ... }
  function buildColumn(columnIndex, positionsPerColumn, columnCount, players) { ... }

  let columns = $derived(
    Array.from({ length: columnCount }, (_, c) =>
      buildColumn(c, positionsPerColumn, columnCount, players)
    )
  );

  let halves = $derived(
    columnCount === 4
      ? [
          { label: 'TOP HALF', columns: [columns[0], columns[1]] },
          { label: 'BOTTOM HALF', columns: [columns[2], columns[3]] },
        ]
      : columns.map(c => ({ label: c.label, columns: [c] }))
  );

  let activeColumn = $state(0);

  // Reset active column when columns change
  $effect(() => {
    if (activeColumn >= columnCount) activeColumn = 0;
  });
</script>
```

Key changes: `export let` → `$props()`, all `$:` → `$derived`/`$state`/`$effect`. The `on:click` in the markup changes to `onclick`.

In the markup, also change:
- `on:click={() => (activeColumn = i)}` → `onclick={() => (activeColumn = i)}`

Steps:
1. Migrate `SplitDraw.svelte` `<script>` section
2. Migrate `DrawPrepChart.svelte` `<script>` section + `on:click` → `onclick` in markup
3. Run `cd web && npm run build`
4. Run `cd web && npx vitest run`

---

## Task 8: Migrate GroupCard.svelte and DrawPrepGroups.svelte to runes

<!-- tdd: modifying-tested-code -->
<!-- checkpoint: test -->

These two components communicate via events (`dispatch("update", ...)` → `on:update={...}`). In Svelte 5, events are replaced with callback props. They must be migrated together to keep their interface consistent.

### `web/src/components/GroupCard.svelte`

Replace entire file:
```svelte
<script>
  let {
    group,
    groupIndex = 1,
    availableWinnerPositions = [],
    availableRunnerUpPositions = [],
    onUpdate,
  } = $props();

  const EMPTY_RUNNER_UP = { na: "", name: "", position: null };

  let winnerSelectOptions = $derived(
    group.winner.position !== null && !availableWinnerPositions.includes(group.winner.position)
      ? [group.winner.position, ...availableWinnerPositions]
      : availableWinnerPositions
  );

  let runnerUpSelectOptions = $derived(
    group.runnerUp?.position != null && !availableRunnerUpPositions.includes(group.runnerUp.position)
      ? [group.runnerUp.position, ...availableRunnerUpPositions]
      : availableRunnerUpPositions
  );

  function dispatchUpdate(field, value, extra = {}) {
    onUpdate?.({ groupIndex: groupIndex - 1, field, value, ...extra });
  }

  function dispatchWinnerUpdate(field, value) {
    const winner = { ...group.winner, [field]: value };
    dispatchUpdate("winner", winner);
  }

  function dispatchRunnerUpUpdate(field, value) {
    const runnerUp = { ...(group.runnerUp || EMPTY_RUNNER_UP), [field]: value };
    dispatchUpdate("runnerUp", runnerUp);
  }

  function onWinnerPositionSelect(e) {
    const val = e.target.value;
    dispatchWinnerUpdate("position", val === "" ? null : parseInt(val, 10));
  }

  function onRunnerUpPositionSelect(e) {
    const val = e.target.value;
    dispatchRunnerUpUpdate("position", val === "" ? null : parseInt(val, 10));
  }

  function toggleRunnerUp(e) {
    const hasRunnerUp = e.target.checked;
    const extra = hasRunnerUp ? { runnerUp: { na: "", name: "", position: null } } : {};
    dispatchUpdate("hasRunnerUp", hasRunnerUp, extra);
  }
</script>

<div class="border border-gray-200 rounded-lg p-3 mb-3 shadow-sm">
  <h3 class="font-bold text-sm text-gray-700 mb-2">Group {groupIndex}</h3>

  <!-- Winner row -->
  <div class="flex items-center gap-2 mb-2 flex-wrap">
    <span class="text-xs font-medium text-green-700 w-16">Winner</span>
    <input
      type="text"
      maxlength="3"
      placeholder="NA"
      class="border border-gray-300 rounded px-2 py-1 w-14 text-center text-sm focus:outline-none focus:border-red-500"
      value={group.winner.na}
      oninput={(e) => dispatchWinnerUpdate("na", e.target.value.toUpperCase())}
    />
    <input
      type="text"
      placeholder="Name"
      class="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[100px] text-sm focus:outline-none focus:border-red-500"
      value={group.winner.name}
      oninput={(e) => dispatchWinnerUpdate("name", e.target.value)}
    />
    {#key availableWinnerPositions.join(",")}
      <select
        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
        value={group.winner.position ?? ""}
        onchange={onWinnerPositionSelect}
      >
        <option value="">Position</option>
        {#each winnerSelectOptions as pos}
          <option value={pos}>{pos}</option>
        {/each}
      </select>
    {/key}
  </div>

  <!-- Runner-up checkbox -->
  <label class="flex items-center gap-2 mb-2 cursor-pointer">
    <input
      type="checkbox"
      checked={group.hasRunnerUp}
      onchange={toggleRunnerUp}
      class="rounded"
    />
    <span class="text-xs text-gray-600">Has runner-up</span>
  </label>

  <!-- Runner-up row -->
  {#if group.hasRunnerUp && group.runnerUp}
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs font-medium text-orange-500 w-16">Runner-up</span>
      <input
        type="text"
        maxlength="3"
        placeholder="NA"
        class="border border-gray-300 rounded px-2 py-1 w-14 text-center text-sm focus:outline-none focus:border-red-500"
        value={group.runnerUp.na}
        oninput={(e) => dispatchRunnerUpUpdate("na", e.target.value.toUpperCase())}
      />
      <input
        type="text"
        placeholder="Name"
        class="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[100px] text-sm focus:outline-none focus:border-red-500"
        value={group.runnerUp.name}
        oninput={(e) => dispatchRunnerUpUpdate("name", e.target.value)}
      />
      {#key availableRunnerUpPositions.join(",")}
        <select
          class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
          value={group.runnerUp.position ?? ""}
          onchange={onRunnerUpPositionSelect}
          disabled={group.winner.position === null}
        >
          <option value="">Position</option>
          {#each runnerUpSelectOptions as pos}
            <option value={pos}>{pos}</option>
          {/each}
        </select>
      {/key}
    </div>
  {/if}
</div>
```

Key changes: `export let` → `$props()`, `createEventDispatcher` → `onUpdate` callback prop, `dispatch("update", data)` → `onUpdate?.(data)`, `on:input` → `oninput`, `on:change` → `onchange`.

### `web/src/components/DrawPrepGroups.svelte`

Replace entire file:
```svelte
<script>
  import GroupCard from "./GroupCard.svelte";

  let {
    groups = [],
    availableWinnerPositions = [],
    availableRunnerUpPositionsPerGroup = [],
    onChange,
    onExport,
    onImport,
    onReset,
  } = $props();

  function handleUpdate(data) {
    const { groupIndex, field, value, extra } = data;
    const updated = [...groups];
    const patch = { [field]: value };
    if (field === 'hasRunnerUp' && value === false) {
      patch.runnerUp = null;
    }
    updated[groupIndex] = { ...updated[groupIndex], ...patch, ...extra };
    onChange?.(updated);
  }

  let fileInput;

  function triggerImport() {
    fileInput.click();
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    if (file) {
      onImport?.(file);
    }
    e.target.value = '';
  }
</script>

<div>
  {#each groups as group, i}
    <GroupCard
      {group}
      groupIndex={i + 1}
      {availableWinnerPositions}
      availableRunnerUpPositions={availableRunnerUpPositionsPerGroup[i] || []}
      onUpdate={handleUpdate}
    />
  {/each}

  <!-- Hidden file input for import -->
  <input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={onFileSelected} />

  <!-- Action buttons -->
  <div class="flex gap-3 mt-4 px-1">
    <Btn cls="bg-blue-500 text-white" onclick={() => onExport?.()}>Export</Btn>
    <Btn cls="bg-gray-500 text-white" onclick={triggerImport}>Import</Btn>
    <Btn cls="bg-red-700 text-white" onclick={() => onReset?.()}>Reset</Btn>
  </div>
</div>
```

Wait — `Btn` import is missing. Add it:
```js
import Btn from "./Btn.svelte";
```

Key changes: `export let` → `$props()`, `createEventDispatcher` → callback props (`onChange`, `onExport`, `onImport`, `onReset`), `dispatch("change", ...)` → `onChange?.(...)`, `on:change` → `onchange`.

### Update `DrawPrep.svelte` to use callback props

In the parent `DrawPrep.svelte`, the `<DrawPrepGroups>` usage changes from event listeners to callback props:

```svelte
<!-- Before: -->
<DrawPrepGroups
  groups={state.groups}
  availableWinnerPositions={availableWinnerPositions}
  availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
  on:change={handleGroupsChange}
  on:export={exportDraw}
  on:import={(e) => importDraw(e.detail.file)}
  on:reset={resetDraw}
/>

<!-- After: -->
<DrawPrepGroups
  groups={state.groups}
  availableWinnerPositions={availableWinnerPositions}
  availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
  onChange={(groups) => handleGroupsChange({ detail: { groups } })}
  onExport={exportDraw}
  onImport={(file) => importDraw(file)}
  onReset={resetDraw}
/>
```

Note: `handleGroupsChange` currently receives `e.detail` via `on:change`. We adapt it by wrapping. Alternatively, we can refactor `handleGroupsChange` to accept `groups` directly (simpler). Choose whichever is cleaner — recommend refactoring:

```js
// Before:
function handleGroupsChange(e) {
  const newGroups = e.detail.groups;
  ...

// After:
function handleGroupsChange(newGroups) {
  ...
```

Then the parent call becomes:
```svelte
<DrawPrepGroups
  ...
  onChange={handleGroupsChange}
  onExport={exportDraw}
  onImport={importDraw}
  onReset={resetDraw}
/>
```

Steps:
1. Migrate `GroupCard.svelte` (replace entire file)
2. Migrate `DrawPrepGroups.svelte` (replace entire file)
3. Update `DrawPrep.svelte`: refactor `handleGroupsChange` to accept `groups` directly, update `<DrawPrepGroups>` usage from events to callbacks
4. Run `cd web && npm run build`
5. Run `cd web && npx vitest run`

⏸ **CHECKPOINT: test** — Verify GroupCard renders correctly, winner/runner-up dropdowns populate, position selection works, runner-up toggle works. Verify DrawPrepGroups renders all cards and export/import/reset buttons fire.

---

## Task 9: Migrate Draw.svelte to runes

<!-- tdd: modifying-tested-code -->
<!-- checkpoint: done -->

The Draw page uses state, derived values, and an async promise.

Replace the `<script>` section of `web/src/pages/Draw.svelte`:
```svelte
<script>
  import Btn from "../components/Btn.svelte";
  import { calculateDraws } from "../lib/calculateDraw";
  import SplitDraw from "../components/SplitDraw.svelte";

  let winners = $state(20);
  let runnerups = $state(20);
  let round = $state(0);
  let players = $state([]);
  let winnersPositions = $state([]);
  let sorted = $state(false);
  let sortedWinnersPosition = $state([]);
  let winnersPositionDisplay = $state([]);
  let runnerUpsPositions = $state([]);
  let byesPositions = $state([]);

  sortedWinnersPosition = $derived.by(() => {
    const arr = [...winnersPositions];
    arr.sort(numberOrder);
    return arr;
  });

  winnersPositionDisplay = $derived(sorted ? sortedWinnersPosition : winnersPositions);

  let winnersGrpsOf4 = $derived(groupInto4s(winnersPositionDisplay));
  let runnerUpsGrpsOf4 = $derived(groupInto4s(runnerUpsPositions));
  let byesGrpsOf4 = $derived(groupInto4s(byesPositions));

  function groupInto4s(array) {
    let grpsOf4 = [];
    for (let i = 0; i < array.length; i += 4) {
      grpsOf4.push(array.slice(i, i + 4));
    }
    return grpsOf4;
  }
  function numberOrder(a, b) {
    return a - b;
  }
  function winnerSeedLabel(n) {
    if (n <= 2) return String(n);
    return "=" + (Math.pow(2, Math.floor(Math.log2(n - 1))) + 1);
  }
  let calculatePromise;
  function calculate() {
    players = [];
    winnersPositions = [];
    runnerUpsPositions = [];
    byesPositions = [];
    round = 0;
    calculatePromise = calculateDraws({ winners, runnerups }).then((data) => {
      round = data.rounds;
      for (let i = 0; i < round; i++) {
        players.push(`${i + 1}`);
      }
      data.byes.forEach((pos) => {
        players[pos - 1] = `${pos}: BYE`;
        byesPositions.push(pos);
      });
      data.winners.forEach((pos, i) => {
        players[pos - 1] = `${pos}: Winner: ${winnerSeedLabel(i + 1)}`;
        winnersPositions.push(pos);
      });
      data.runnerups.forEach((pos) => {
        players[pos - 1] = `${pos}: Runner-up`;
        runnerUpsPositions.push(pos);
      });
      players = players;
      winnersPositions = winnersPositions;
      runnerUpsPositions.sort(numberOrder);
      runnerUpsPositions = runnerUpsPositions;
      byesPositions.sort(numberOrder);
      byesPositions = byesPositions;
    });
  }
</script>
```

In the markup, change:
- `on:keyup={calculate}` → `onkeyup={calculate}` (on the two `<input>` elements)

The rest of the template is unchanged (already using `bind:value`, `bind:checked`, `{#each}`, `{#if}`, `{#await}` — all compatible with Svelte 5).

Steps:
1. Replace `<script>` section of `Draw.svelte`
2. Change `on:keyup` → `onkeyup` in the two `<input>` elements
3. Run `cd web && npm run build`
4. Run `cd web && npx vitest run`
5. Verify in browser: enter numbers, click Calculate, see results, toggle Ascending checkbox

⏸ **CHECKPOINT: done** — Verify the Draw page works end-to-end: inputs accept numbers, calculate button produces results, ascending sort toggles, spinner shows during calculation.

---

## Task 10: Migrate DrawPrep.svelte to runes

<!-- tdd: modifying-tested-code -->
<!-- checkpoint: done -->

The most complex migration: state, derived values, effects (auto-save), lifecycle (onMount/onDestroy).

Replace the `<script>` section of `web/src/pages/DrawPrep.svelte`:
```svelte
<script>
  import Btn from "../components/Btn.svelte";
  import { calculateDraws } from "../lib/calculateDraw";
  import DrawPrepChart from "../components/DrawPrepChart.svelte";
  import DrawPrepGroups from "../components/DrawPrepGroups.svelte";
  import { getOccupiedPositions, getAvailablePositions, deriveActivePositions, isInOppositeHalf, clearInvalidRunnerUps } from "../lib/positions";
  import { save as storageSave, remove as storageRemove, loadAll, loadMostRecent } from "../lib/storage";
  import { formatExportFilename } from "../lib/exportFilename";
  import { onMount } from "svelte";

  let numGroupsInput = $state("");
  let eventNameInput = $state("");
  let fileInput;
  let confirmed = $state(false);
  let error = $state("");
  let warnings = $state([]);
  let mobileTab = $state('groups');
  let state = $state(null);

  let occupiedPositions = $derived(state ? getOccupiedPositions(state.groups) : new Set());
  let activePositions = $derived(state ? deriveActivePositions(state) : null);
  let availableWinnerPositions = $derived(
    state ? getAvailablePositions(state.baseWinnerPositions, occupiedPositions) : []
  );
  let availableRunnerUpPositionsPerGroup = $derived(
    state && activePositions
      ? state.groups.map(group => {
          if (group.winner.position === null) return [];
          return getAvailablePositions(activePositions.runnerups, occupiedPositions)
            .filter(pos => isInOppositeHalf(pos, group.winner.position, state.round))
            .sort((a, b) => a - b);
        })
      : []
  );

  function playerLabel(player, fallback) {
    const name = player.name || fallback;
    return player.na ? `${name} (${player.na})` : name;
  }

  let placedPlayers = $derived(
    state
      ? (() => {
          const map = new Map();
          state.groups.forEach((group, idx) => {
            if (group.winner.position !== null) {
              map.set(group.winner.position, {
                name: group.winner.name || `Winner (Group ${idx + 1})`,
                na: group.winner.na,
                type: 'winner',
                label: playerLabel(group.winner, `Winner (Group ${idx + 1})`),
              });
            }
            const ruPos = group.runnerUp?.position;
            if (ruPos != null) {
              map.set(ruPos, {
                name: group.runnerUp.name || `Runner-up (Group ${idx + 1})`,
                na: group.runnerUp.na,
                type: 'runnerup',
                label: playerLabel(group.runnerUp, `Runner-up (Group ${idx + 1})`),
              });
            }
          });
          return map;
        })()
      : new Map()
  );

  let chartProps = $derived(
    state && activePositions
      ? {
          round: state.round,
          winners: activePositions.winners,
          runnerups: activePositions.runnerups,
          byes: activePositions.byes,
          placedPlayers,
        }
      : null
  );

  const EMPTY_PLAYER = { na: "", name: "", position: null };

  function makeEmptyGroups(count) {
    return Array.from({ length: count }, () => ({
      winner: { ...EMPTY_PLAYER },
      hasRunnerUp: true,
      runnerUp: { ...EMPTY_PLAYER },
    }));
  }

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
      confirmed = true;
    } catch (e) {
      error = e.message || "Failed to calculate draw";
    }
  }

  function onSetupFileSelected(e) {
    const file = e.target.files[0];
    if (file) importDraw(file);
    e.target.value = '';
  }

  function handleGroupsChange(newGroups) {
    let finalGroups = newGroups;
    if (state) {
      const tempState = { ...state, groups: finalGroups };
      const active = deriveActivePositions(tempState);
      const { groups: clearedGroups, cleared } = clearInvalidRunnerUps(finalGroups, active, state.round);
      if (cleared.length > 0) {
        finalGroups = clearedGroups;
        warnings = cleared.map(i => `Group ${i + 1} runner-up position cleared (no longer valid)`);
        setTimeout(() => { warnings = []; }, 4000);
      }
    }
    state = { ...state, groups: finalGroups };
  }

  async function importDraw(file) { /* unchanged */ }
  function exportDraw() { /* unchanged */ }
  function resetDraw() { /* unchanged */ }

  // Auto-save with $effect
  $effect(() => {
    if (state) {
      const timeout = setTimeout(() => {
        storageSave(state);
      }, 500);
      return () => clearTimeout(timeout);
    }
  });

  async function computeDrawData(numGroups) { /* unchanged */ }
  function buildState(numGroups, groups, drawData) { /* unchanged */ }

  onMount(async () => {
    loadAll();
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
</script>
```

Key changes:
- All `let x = val` → `$state(val)`
- All `$:` → `$derived()` or `$derived.by()`
- Auto-save `$:` block → `$effect()` with cleanup return (replaces `onDestroy` + manual `clearTimeout`)
- `onMount` kept as-is (it still works in Svelte 5)
- `handleGroupsChange` refactored to accept `groups` directly (not `e.detail.groups`)
- `onDestroy` import removed (auto-save cleanup handled by `$effect` return)

In the markup, change:
- `on:keydown` → `onkeydown` on the two setup `<input>` elements
- `on:change` → `onchange` on the file input
- `on:click` → `onclick` on mobile tab buttons
- `<DrawPrepGroups>` uses callback props (already done in Task 8)

Steps:
1. Replace `<script>` section (keep `importDraw`, `exportDraw`, `resetDraw`, `computeDrawData`, `buildState` bodies unchanged — they're pure logic)
2. Update markup event handlers: `on:keydown` → `onkeydown`, `on:change` → `onchange`, `on:click` → `onclick`
3. Run `cd web && npm run build`
4. Run `cd web && npx vitest run`

⏸ **CHECKPOINT: done** — Verify DrawPrep page: setup form, confirm groups, edit winner/runner-up positions, chart updates, import/export JSON, auto-save to localStorage, mobile tabs.

---

## Task 11: Set up component testing infrastructure + add tests (Part 1)

<!-- tdd: new-feature -->

Set up the testing infrastructure and add tests for the simpler components.

### Step 1: Add test configuration

**`web/vite.config.js`** — already has `test` block from Task 3. Verify it includes:
```js
test: {
  environment: 'jsdom',
},
```

**`web/package.json`** — add test-related dependencies (already installed in Task 3):
- `@testing-library/svelte`
- `jsdom`

Add script:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### Step 2: Write `web/src/components/Btn.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import Btn from "./Btn.svelte";

describe("Btn", () => {
  it("renders with custom class", () => {
    const { getByRole } = render(Btn, { cls: "bg-red-500 text-white" });
    const button = getByRole("button");
    expect(button.className).toContain("bg-red-500");
    expect(button.className).toContain("text-white");
    expect(button.className).toContain("uppercase");
    expect(button.className).toContain("tracking-wide");
  });

  it("fires onclick when clicked", async () => {
    const handler = vi.fn();
    const { getByRole } = render(Btn, { onclick: handler });
    await fireEvent.click(getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire onclick when disabled", async () => {
    const handler = vi.fn();
    const { getByRole } = render(Btn, { onclick: handler, disabled: true });
    const button = getByRole("button");
    expect(button).toBeDisabled();
    await fireEvent.click(button);
    expect(handler).not.toHaveBeenCalled();
  });

  it("renders slot content", () => {
    // @testing-library/svelte renders children via snippet
    const { getByRole } = render(Btn, { children: () => "Click Me" });
    expect(getByRole("button")).toHaveTextContent("Click Me");
  });
});
```

### Step 3: Write `web/src/components/GroupCard.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import GroupCard from "./GroupCard.svelte";

function makeGroup(overrides = {}) {
  return {
    winner: { na: "", name: "", position: null },
    hasRunnerUp: true,
    runnerUp: { na: "", name: "", position: null },
    ...overrides,
  };
}

describe("GroupCard", () => {
  it("renders group index", () => {
    const { container } = render(GroupCard, {
      group: makeGroup(),
      groupIndex: 3,
      availableWinnerPositions: [1, 4, 5, 8],
      availableRunnerUpPositions: [2, 3, 6, 7],
      onUpdate: vi.fn(),
    });
    expect(container.textContent).toContain("Group 3");
  });

  it("shows available winner positions in dropdown", () => {
    const onUpdate = vi.fn();
    const { container } = render(GroupCard, {
      group: makeGroup(),
      groupIndex: 1,
      availableWinnerPositions: [1, 4, 5, 8],
      availableRunnerUpPositions: [2, 3],
      onUpdate,
    });
    const select = container.querySelectorAll("select")[0];
    const options = Array.from(select.options).map(o => o.value);
    expect(options).toContain("1");
    expect(options).toContain("4");
    expect(options).toContain("5");
    expect(options).toContain("8");
  });

  it("calls onUpdate when winner name is entered", async () => {
    const onUpdate = vi.fn();
    const { container } = render(GroupCard, {
      group: makeGroup(),
      groupIndex: 1,
      availableWinnerPositions: [],
      availableRunnerUpPositions: [],
      onUpdate,
    });
    const inputs = container.querySelectorAll("input[type='text']");
    const nameInput = inputs[1]; // second text input is winner name
    await fireEvent.input(nameInput, { target: { value: "Player A" } });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        groupIndex: 0,
        field: "winner",
        value: expect.objectContaining({ name: "Player A" }),
      })
    );
  });

  it("hides runner-up row when hasRunnerUp is false", () => {
    const { container } = render(GroupCard, {
      group: makeGroup({ hasRunnerUp: false, runnerUp: null }),
      groupIndex: 1,
      availableWinnerPositions: [],
      availableRunnerUpPositions: [],
      onUpdate: vi.fn(),
    });
    expect(container.textContent).not.toContain("Runner-up");
  });

  it("shows runner-up row when hasRunnerUp is true", () => {
    const { container } = render(GroupCard, {
      group: makeGroup({ hasRunnerUp: true, runnerUp: { na: "", name: "", position: null } }),
      groupIndex: 1,
      availableWinnerPositions: [],
      availableRunnerUpPositions: [3],
      onUpdate: vi.fn(),
    });
    expect(container.textContent).toContain("Runner-up");
  });
});
```

Steps:
1. Verify test configuration
2. Write `Btn.test.ts`
3. Run `cd web && npx vitest run src/components/Btn.test.ts` — all pass
4. Write `GroupCard.test.ts`
5. Run `cd web && npx vitest run src/components/GroupCard.test.ts` — all pass
6. Run `cd web && npx vitest run` — all tests (lib + component) pass

---

## Task 12: Add component tests (Part 2)

<!-- tdd: new-feature -->

Tests for remaining components and pages.

### `web/src/components/DrawPrepGroups.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import DrawPrepGroups from "./DrawPrepGroups.svelte";

function makeGroups(count: number) {
  return Array.from({ length: count }, () => ({
    winner: { na: "", name: "", position: null },
    hasRunnerUp: true,
    runnerUp: { na: "", name: "", position: null },
  }));
}

describe("DrawPrepGroups", () => {
  it("renders one GroupCard per group", () => {
    const { container } = render(DrawPrepGroups, {
      groups: makeGroups(4),
      availableWinnerPositions: [1, 4, 5, 8],
      availableRunnerUpPositionsPerGroup: [[2, 3], [2, 3], [2, 3], [2, 3]],
      onChange: vi.fn(),
      onExport: vi.fn(),
      onImport: vi.fn(),
      onReset: vi.fn(),
    });
    // Check "Group N" headings appear
    expect(container.textContent).toContain("Group 1");
    expect(container.textContent).toContain("Group 2");
    expect(container.textContent).toContain("Group 3");
    expect(container.textContent).toContain("Group 4");
  });

  it("fires onExport when Export button clicked", async () => {
    const onExport = vi.fn();
    const { getByRole } = render(DrawPrepGroups, {
      groups: makeGroups(2),
      availableWinnerPositions: [],
      availableRunnerUpPositionsPerGroup: [],
      onChange: vi.fn(),
      onExport,
      onImport: vi.fn(),
      onReset: vi.fn(),
    });
    const buttons = getAllByRole(getByRole, "button");
    const exportBtn = buttons.find((b: HTMLButtonElement) => b.textContent?.includes("Export"));
    expect(exportBtn).toBeTruthy();
    await fireEvent.click(exportBtn!);
    expect(onExport).toHaveBeenCalled();
  });

  it("fires onReset when Reset button clicked", async () => {
    const onReset = vi.fn();
    const { getByText } = render(DrawPrepGroups, {
      groups: makeGroups(2),
      availableWinnerPositions: [],
      availableRunnerUpPositionsPerGroup: [],
      onChange: vi.fn(),
      onExport: vi.fn(),
      onImport: vi.fn(),
      onReset,
    });
    await fireEvent.click(getByText("Reset"));
    expect(onReset).toHaveBeenCalled();
  });
});
```

Note: The `getAllByRole` helper may need adjustment based on the actual testing-library API. The executor should verify the import and usage.

### `web/src/components/SplitDraw.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import SplitDraw from "./SplitDraw.svelte";

describe("SplitDraw", () => {
  it("renders player positions for a round of 8", () => {
    const players = [
      "1: Winner: 1", "2: BYE", "3: Runner-up", "4: Winner: 2",
      "5: Winner: 3", "6: Runner-up", "7: BYE", "8: Winner: 4",
    ];
    const { container } = render(SplitDraw, { round: 8, players });
    expect(container.textContent).toContain("TOP HALF");
    expect(container.textContent).toContain("BOTTOM HALF");
  });

  it("renders with empty players array", () => {
    const { container } = render(SplitDraw, { round: 4, players: [] });
    expect(container.textContent).toContain("TOP HALF");
  });
});
```

Steps:
1. Write `DrawPrepGroups.test.ts`
2. Run `cd web && npx vitest run src/components/DrawPrepGroups.test.ts` — pass
3. Write `SplitDraw.test.ts`
4. Run `cd web && npx vitest run src/components/SplitDraw.test.ts` — pass
5. Run `cd web && npx vitest run` — all tests pass

---

## Task 13: Final cleanup — svelte-check, build verification

<!-- tdd: trivial -->

Add `svelte-check` and verify everything is clean.

### Step 1: Create `web/tsconfig.json`

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "target": "ESNext",
    "module": "ESNext",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"]
}
```

Note: The exact tsconfig may need adjustment. If `svelte-check` works without a tsconfig, skip this step. The executor should try `npx svelte-check` first and only create tsconfig if needed.

### Step 2: Add svelte-check

```bash
cd web && npm install -D svelte-check
```

Add script to `web/package.json`:
```json
"check": "svelte-check --tsconfig ./tsconfig.json"
```

### Step 3: Run full verification

```bash
cd web
npx svelte-check --tsconfig ./tsconfig.json  # or just npx svelte-check
npm run build
npx vitest run
```

All should pass with zero errors.

### Step 4: Verify no dead Code

Grep for any remaining Svelte 3 patterns that should have been migrated:
```bash
grep -r "createEventDispatcher" web/src/  # should return nothing
grep -r "from \"svetamat\"" web/src/      # should return nothing
grep -r "elevation-" web/src/             # should return nothing
grep -r "on:click" web/src/               # should return nothing (all migrated to onclick)
grep -r "export let" web/src/             # should return nothing (all migrated to $props)
```

### Step 5: Clean up

Remove any remaining artifacts:
- Delete `web/public/fonts/` directory if empty
- Verify `web/package.json` has no obsolete dependencies

Steps:
1. Install svelte-check, add check script
2. Run svelte-check — zero errors
3. Run full build — succeeds
4. Run all tests — pass
5. Grep verification — no dead patterns
6. Final browser smoke test: both pages work end-to-end

---

## Summary

| Task | What | Risk | Checkpoint |
|---|---|---|---|
| 1 | Verify baseline | None | — |
| 2 | Replace elevation → shadow | Low | — |
| 3 | Upgrade Svelte 5 + Vite 6 + Tailwind 4 | **Medium** | done |
| 4 | Fonts cleanup | Low | — |
| 5 | Remove svetamat + create Btn.svelte | **Medium** | done |
| 6 | Migrate App + Logo + Btn to runes | Low | — |
| 7 | Migrate SplitDraw + DrawPrepChart to runes | Low | — |
| 8 | Migrate GroupCard + DrawPrepGroups to runes | **Medium** | test |
| 9 | Migrate Draw.svelte to runes | **Medium** | done |
| 10 | Migrate DrawPrep.svelte to runes | **High** | done |
| 11 | Testing infrastructure + tests Part 1 | Low | — |
| 12 | Component tests Part 2 | Low | — |
| 13 | Final cleanup + svelte-check | Low | — |

**Risk rationale**: Tasks 3, 5, 8-10 touch runtime behavior. Tasks 8 and 10 are the most complex migrations (event re-wiring and lifecycle changes). Everything else is low-risk infrastructure or display changes.

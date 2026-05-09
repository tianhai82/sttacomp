# Modernize Toolchain & Remove Svetamat — Design Doc

## Goal

Upgrade the sttacomp frontend to a modern, well-tested, maintainable codebase:
- Remove `svetamat` dependency (unmaintained) — replace with plain HTML + Tailwind
- Upgrade to Svelte 5 (runes API)
- Upgrade to Tailwind 4 (native Vite plugin, zero config files)
- Upgrade to Vite 6 + latest `@sveltejs/vite-plugin-svelte`
- Replace self-hosted Roboto fonts with Google Fonts CDN (simpler, auto-updated)
- Add component tests for all Svelte components
- All existing lib tests continue passing

## Scope

### In scope
- 3 pages: `Draw.svelte`, `DrawPrep.svelte`, `App.svelte`
- 4 components: `GroupCard.svelte`, `DrawPrepGroups.svelte`, `SplitDraw.svelte`, `DrawPrepChart.svelte`
- 1 pure display component: `Logo.svelte` (no changes needed)
- 6 lib modules: `draw.ts`, `calculateDraw.ts`, `positions.ts`, `storage.ts`, `exportFilename.ts`, `types.ts`
- 4 test files (existing, continue passing)
- New component tests for all Svelte components
- CSS/fonts cleanup
- Vite + Tailwind config simplification

### Out of scope
- Firebase hosting config (no changes needed)
- Deploy script
- New features or UI redesign

---

## Slice 1: Toolchain & Config Upgrade

**What**: Replace the entire build toolchain with modern versions. App should still build and render identically before any component migration.

### Changes

**`web/package.json`** — new dependencies:
```json
{
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.x",
    "@tailwindcss/vite": "^4.3",
    "svelte": "^5.x",
    "tailwindcss": "^4.3",
    "vite": "^6.x",
    "vitest": "^3.x",
    "@sveltejs/vitest-plugin-svelte": "^1.x",
    "svelte-check": "^4.x"
  },
  "dependencies": {}
}
```

Remove: `svetamat`, `autoprefixer`, `postcss`, `svelte-preprocess`, `tailwindcss-elevation`

**`web/vite.config.js`** — simplified:
```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
});
```

**`web/svelte.config.js`** — new file (needed by svelte-check and vitest):
```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess() };
```

**Delete**:
- `web/tailwind.config.js`
- `web/postcss.config.js`

### Testing
- `npm run build` succeeds
- App renders identically in browser (Svelte 3 syntax still works in compat mode briefly, but we migrate immediately in slices below)

---

## Slice 2: CSS & Fonts Cleanup

**What**: Modernize fonts and remove unused CSS infrastructure.

### Changes

**`web/src/global.css`** — replace entire file:
```css
@import "tailwindcss";

@theme {
  --color-gray-150: #d4d4d8;
}
```

**`web/index.html`** — add Google Fonts in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

Move body styles into Tailwind layer:
```css
@layer base {
  body {
    margin: 0;
    font-family: 'Roboto', sans-serif;
    min-height: 100vh;
  }
}
```

**Delete**: All `@font-face` declarations, self-hosted font files in `web/public/fonts/` (~40 files). Google Fonts handles Material Icons and Roboto via CDN. Keep `favicon.png`.

### Testing
- App still displays Roboto font
- Error icon in Draw.svelte still shows (Material Icon)
- Ripple effect still works (`.ripple` class kept in global CSS)

---

## Slice 3: Remove Svetamat — Inline Components

**What**: Replace all 4 svetamat components with plain HTML + Tailwind. No Svelte syntax changes yet — just remove the dependency.

### `Button` replacement (used in 3 files)

Current svetamat `Button` API:
```svelte
<Button bgColor="bg-red-500" textColor="text-white" on:click={fn}>Label</Button>
```

Replace with a simple inline `<button>` with equivalent classes. The svetamat Button added `elevation-2`, `focus:outline-none`, `uppercase tracking-wide`, sizing, and hover elevation. We map these to standard Tailwind:

```svelte
<button class="bg-red-500 text-white focus:outline-none uppercase tracking-wide
  h-8 px-4 rounded shadow-sm hover:shadow-md active:shadow-none transition-shadow"
  onclick={fn}>
  Label
</button>
```

Since this pattern repeats (5-6 buttons across the app), create a thin `web/src/components/Btn.svelte`:

```svelte
<script>
  let { class: cls = "", onclick, disabled = false, children } = $props();
</script>

<button
  class="focus:outline-none uppercase tracking-wide h-8 px-4 rounded
    shadow-sm hover:shadow-md active:shadow-none transition-shadow
    disabled:opacity-25 disabled:cursor-not-allowed {cls}"
  {onclick}
  {disabled}
>
  {@render(children())}
</button>
```

Usage:
```svelte
<Btn class="bg-red-500 text-white" onclick={calculate}>Calculate</Btn>
```

### `Input` replacement (used in `Draw.svelte`)

Current:
```svelte
<Input number outlined on:keyup={calculate} label="Total no. of winners" bind:value={winners} />
```

Replace with a native `<input>` wrapped in a label:
```svelte
<div>
  <label class="block text-gray-700 text-sm mb-1">Total no. of winners</label>
  <input
    type="number"
    class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
    bind:value={winners}
    onkeyup={calculate}
  />
</div>
```

Note: This is the exact same pattern already used in `DrawPrep.svelte`'s setup form (which uses plain `<input>` already — not svetamat's Input).

### `Checkbox` replacement (used in `Draw.svelte`)

Current:
```svelte
<Checkbox label="Ascending" color="text-orange-600" bind:checked={sorted} />
```

Replace with a native checkbox with label:
```svelte
<label class="flex items-center cursor-pointer text-orange-600">
  <input type="checkbox" class="mr-1.5" bind:checked={sorted} />
  <span>Ascending</span>
</label>
```

Note: The svetamat Checkbox used Material Icons to render fancy checkbox icons. A native checkbox is simpler and more accessible. The Material Icons dependency was only for this one checkbox — we can keep the Google Fonts import since Draw.svelte also uses `material-icons` for the error icon.

### `Spinner` replacement (used in `Draw.svelte`)

Current svetamat Spinner is just an SVG with CSS animation. Inline it directly:

```svelte
<svg class="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 50 50">
  <circle class="stroke-current stroke-[5px] fill-none stroke-linecap-round animate-dash" cx="25" cy="25" r="20" />
</svg>
```

Or even simpler — replace with a Tailwind spinner:
```html
<div class="h-8 w-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
```

### Testing
- All buttons clickable and styled
- Number inputs work with keyboard
- Checkbox toggles ascending sort
- Spinner shows during calculation
- `npm run build` succeeds with `svetamat` removed from `package.json`

---

## Slice 4: Migrate to Svelte 5 Runes (Lib modules)

**What**: Convert all reactive logic to Svelte 5 runes. Start with the leaf files that have no components depending on them — the lib modules are pure TS and need no changes. The migration is only in `.svelte` files.

This slice focuses on the **non-UI logic files** that use Svelte reactivity — which are all in the page/component `.svelte` files. The pure TS lib files (`draw.ts`, `positions.ts`, etc.) need zero changes.

### Files changed (Svelte 3 → 5 syntax):

| File | Key changes |
|---|---|
| `App.svelte` | `let selectedPage` → `$state`, `$:` → `$derived`, `on:click` → `onclick` |
| `Draw.svelte` | `let winners` etc. → `$state`, all `$:` → `$derived`/`$derived.by`, `on:click`/`on:keyup` → `onclick`/`onkeyup`, remove svetamat imports, `bind:checked` stays, `bind:value` stays |
| `DrawPrep.svelte` | Same rune migration, `onMount`/`onDestroy` → `$effect` cleanup, `createEventDispatcher` → callback props, `export let` → `$props()` |
| `DrawPrepGroups.svelte` | `export let` → `$props()`, `createEventDispatcher` → callback props, `on:click` → `onclick` |
| `GroupCard.svelte` | `export let` → `$props()`, `createEventDispatcher` → callback props, `$:` → `$derived`, `on:change`/`on:input` → `onchange`/`oninput` |
| `SplitDraw.svelte` | `export let` → `$props()`, `$:` → `$derived` |
| `DrawPrepChart.svelte` | `export let` → `$props()`, `$:` → `$derived`/`$derived.by` |

### Key migration patterns applied consistently:

1. **State**: `let x = val` → `let x = $state(val)`
2. **Derived**: `$: x = fn(y)` → `let x = $derived(fn(y))`
3. **Derived blocks**: `$: { ... }` → `let x = $derived.by(() => { ... return val })`
4. **Effects**: `$: if (cond) { ... }` → `$effect(() => { if (cond) { ... } })`
5. **Props**: `export let x = default` → `let { x = default } = $props()`
6. **Events**: `on:click={fn}` → `onclick={fn}`
7. **Component events**: `dispatch("change", data)` → callback prop `onChange(data)`
8. **Lifecycle**: `onMount`/`onDestroy` → `$effect` with cleanup return

### Testing
- All existing lib tests still pass (no changes to lib code)
- App renders and all interactions work:
  - Draw page: input numbers, click calculate, see results, toggle ascending
  - Draw Prep page: setup groups, assign winners/runner-ups, see chart update
  - Import/export JSON files
  - Auto-save to localStorage
  - Mobile tab switching

---

## Slice 5: Add Component Tests

**What**: Add Vitest + Svelte Testing Library tests for all Svelte components.

### Setup

Add to `web/package.json` devDependencies:
- `@testing-library/svelte` — DOM queries for Svelte components
- `jsdom` — DOM environment

Add vitest config in `web/vite.config.js`:
```js
test: {
  environment: 'jsdom',
  globals: true,
}
```

### Test files to create

| Test file | What it covers |
|---|---|
| `web/src/components/Btn.test.ts` | Renders with class, fires onclick, disabled state |
| `web/src/components/GroupCard.test.ts` | Renders group data, dropdowns show available positions, dispatches updates on input change, toggles runner-up |
| `web/src/components/DrawPrepGroups.test.ts` | Renders N group cards, export/import/reset buttons fire callbacks |
| `web/src/components/SplitDraw.test.ts` | Renders player positions for various round sizes, colors by type |
| `web/src/components/DrawPrepChart.test.ts` | Renders chart with placed players, mobile/desktop views |
| `web/src/pages/Draw.test.ts` | Full page: inputs, calculate button, result display, ascending checkbox, spinner |
| `web/src/pages/DrawPrep.test.ts` | Setup form, confirm, group editing, chart renders, import/export/reset flow |

### Testing
- `npm test` runs all lib + component tests
- Coverage includes all user-facing behaviors

---

## Slice 6: Add `svelte-check` and Final Cleanup

**What**: Ensure type safety and clean up remaining artifacts.

### Changes
- Add `npm run check` script: `svelte-check --tsconfig ./tsconfig.json`
- Add a minimal `web/tsconfig.json` if needed for svelte-check
- Remove `web/node_modules/svetamat` from `tailwind.config.js` content paths (already deleted)
- Remove `elevation-*` classes — replace with Tailwind `shadow-*`:
  - `elevation-2` → `shadow-sm`
  - `elevation-3` → `shadow-md`
  - `elevation-4` → `shadow-lg`
  - `hover:elevation-4` → `hover:shadow-lg`
  - `active:elevation-0` → `active:shadow-none`
- Remove `tailwindcss-elevation` dependency
- Remove `.ripple` CSS hack — replace with Tailwind `transition-shadow` + `active:scale-95` if desired, or keep simple ripple

### Testing
- `npm run check` passes with no errors
- `npm run build` succeeds
- All tests pass
- Deploy to Firebase and verify in browser

---

## Dependency Summary

### Remove
- `svetamat`
- `autoprefixer`
- `postcss`
- `svelte-preprocess`
- `tailwindcss-elevation`

### Add
- `@tailwindcss/vite` ^4.3
- `@testing-library/svelte`
- `@sveltejs/vitest-plugin-svelte`
- `svelte-check`
- `jsdom`

### Upgrade
- `svelte` ^3 → ^5
- `@sveltejs/vite-plugin-svelte` ^2 → ^5
- `vite` ^4 → ^6
- `tailwindcss` ^3 → ^4
- `vitest` ^4 → ^3 (latest stable for this ecosystem)

### Untouched
- `firebase` (hosting only, no code dependency)
- All lib/*.ts files (pure TypeScript, no framework dependency)
- All existing test files (continue passing as-is)

---

## Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Svelte 5 runes migration breaks reactive bindings | Migrate one file at a time, test after each |
| Tailwind 4 doesn't support `elevation-*` plugin | Replace with native `shadow-*` utilities |
| `bind:value` on number inputs behaves differently in Svelte 5 | Test thoroughly, use `type="number"` with explicit `bind:value` |
| Google Fonts CDN adds external dependency | Acceptable trade-off — simpler than 40 self-hosted font files |
| Component test setup with Svelte 5 + vitest has rough edges | Use `@sveltejs/vitest-plugin-svelte` (official, supports Svelte 5) |

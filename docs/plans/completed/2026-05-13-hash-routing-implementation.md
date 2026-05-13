# Hash-based Routing Implementation Plan

Based on [design doc](./2026-05-13-hash-routing-design.md).

## Task 1: Install svelte-spa-router and replace tab switching with routing

<!-- tdd: modifying-tested-code -->

Files:
- `web/package.json` (dependency addition)
- `web/src/App.svelte` (rewrite)

Steps:

1. Install the dependency:
   ```bash
   cd web && npm install svelte-spa-router
   ```

2. Rewrite `web/src/App.svelte` to:
   - Remove `selectedPage` state
   - Import `Router` from `svelte-spa-router`, `link` action from `svelte-spa-router`, and `active` action from `svelte-spa-router/active`
   - Import `router` from `svelte-spa-router` for active tab detection
   - Define a `routes` object mapping `'/'` to `Draw` and `'/draw-prep'` to `DrawPrep`
   - Replace `<button>` nav elements with `<a>` elements using `use:link` and `use:active` for navigation and active styling
   - Replace `{#if selectedPage === 'draw'}` block with `<Router {routes} />`

   Full replacement for `web/src/App.svelte`:

   ```svelte
   <script>
     import Logo from "./components/Logo.svelte";
     import Draw from "./pages/Draw.svelte";
     import DrawPrep from "./pages/DrawPrep.svelte";
     import Router from "svelte-spa-router";
     import { link } from "svelte-spa-router";
     import active from "svelte-spa-router/active";

     const routes = {
       "/": Draw,
       "/draw-prep": DrawPrep,
     };
   </script>

   <div
     class="h-12 shadow-lg bg-red-600 flex justify-between items-center pl-4 md:pl-6 pr-3">
     <h1 class="text-white font-bold text-lg flex items-center">
       <Logo />
       <span class="hidden sm:inline">Table Tennis Draw Helper</span>
       <span class="sm:hidden text-base">TT Draw</span>
     </h1>
     <div class="flex h-full">
       <a
         href="/"
         use:link
         use:active={{ path: "/", className: "border-white bg-red-700", inactiveClassName: "border-transparent bg-red-600" }}
         class="h-full text-white ripple focus:outline-none px-3 border-b-2 flex items-center">
         <span class="hidden sm:inline">Draw Positions</span>
         <span class="sm:hidden text-sm">Positions</span>
       </a>
       <a
         href="/draw-prep"
         use:link
         use:active={{ path: "/draw-prep", className: "border-white bg-red-700", inactiveClassName: "border-transparent bg-red-600" }}
         class="h-full text-white ripple focus:outline-none px-3 border-b-2 flex items-center">
         <span class="hidden sm:inline">Do Draw</span>
         <span class="sm:hidden text-sm">Draw</span>
       </a>
     </div>
   </div>
   <Router {routes} />
   ```

   Key notes:
   - `svelte-spa-router` uses hash-based routing by default — no explicit `hashMode` flag needed
   - The `use:link` action prepends `#` to href values automatically
   - The `use:active` action adds/removes CSS classes based on the current route
   - Changed `<button>` to `<a>` with `flex items-center` to maintain vertical centering (previously buttons had default centering behavior)
   - `border-b-2` remains on the `<a>` element so both active and inactive borders render

3. Run existing tests to verify nothing is broken:
   ```bash
   cd web && npx vitest run
   ```
   Expected: 8 test files, 71 tests passing.

4. Start dev server and manually verify:
   - App loads at `http://localhost:5173` with `#/` hash, showing Draw Positions
   - Click "Do Draw" tab → URL changes to `#/draw-prep`, DrawPrep renders
   - Click "Draw Positions" tab → URL changes to `#/`, Draw renders
   - Browser back/forward works between the two tabs
   - Direct load of `http://localhost:5173/#/draw-prep` renders Do Draw tab
   - Active tab has white bottom border and darker red background

   ```bash
   cd web && npm run dev
   ```

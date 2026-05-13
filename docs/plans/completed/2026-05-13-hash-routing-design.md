# Hash-based Routing with svelte-spa-router

## Context

The app currently uses a `selectedPage` state variable to switch between two tabs (Draw Positions, Do Draw). This means no shareable URLs, no browser back/forward, and no bookmarks to a specific tab. Nested routes are expected soon.

## Decision

Add `svelte-spa-router` v5 (Svelte 5 compatible) with hash-based routing. Hash mode requires no server-side config, making it a zero-config fit for Firebase Hosting.

## URL Map

| Hash | Component | Tab |
|---|---|---|
| `#/` | `Draw.svelte` | Draw Positions |
| `#/draw-prep` | `DrawPrep.svelte` | Do Draw |

## Architecture

```
main.js
  └─ mount(App)        ← no change
App.svelte
  ├─ <Router hashMode>
  │   ├─ <Route path="/">           → Draw.svelte
  │   └─ <Route path="/draw-prep">  → DrawPrep.svelte
  └─ Nav bar (active styling based on current route)
```

## Changes

| File | Change |
|---|---|
| `web/package.json` | Add `svelte-spa-router` dependency |
| `web/src/App.svelte` | Replace `selectedPage` + `{#if}` with `<Router>` + `<Route>` |

## What stays the same

- Both page components (`Draw.svelte`, `DrawPrep.svelte`) — untouched
- All child components — untouched
- `main.js` — untouched
- Firebase config — untouched
- Build/deploy pipeline — untouched

## Future nested routes

When needed, add `<Route path="/draw-prep/:id">` — no architectural change required.

## Slices

### Slice 1: Install svelte-spa-router and wire up routing
- Add `svelte-spa-router` to `web/package.json`
- Rewrite `App.svelte`: replace `selectedPage` state + `{#if}` with `<Router hashMode>` + two `<Route>` components
- Nav buttons navigate via hash (`href="#/"` and `href="#/draw-prep"`) with active styling derived from current route
- Default route (`#/`) loads Draw Positions

### Slice 2: Verify navigation works
- Manual check: clicking tabs updates the URL hash and renders the correct page
- Browser back/forward navigates between tabs
- Direct load of `#/draw-prep` renders the Do Draw tab
- Existing functionality in both tabs is preserved

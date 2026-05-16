# Changelog

## 2026-05-16 — Empty state & delete UX

- Always show "My Draws" list (no longer skips to setup when empty)
- Empty state now has drag-and-drop zone + Import Draw button
- Moved delete action to trash icon in top nav bar (removed Reset button from groups)
- Updated confirm dialog text from "Reset" to "Delete"

## 2026-05-14 — Multiple saved draws

- Added "My Draws" landing page on /draw-prep — card grid of all saved draws
- Create, open, switch between, and delete draws from the list
- Draws sorted by most recently modified
- "Back to My Draws" link in the editing view
- Empty state with "Create your first draw" CTA when no draws exist
- Added `listAll()` to storage module with full test coverage (4 new tests)

## 2026-05-13 — Hash-based routing

- Added `svelte-spa-router` for client-side hash routing
- Draw Positions accessible at `#/` (default)
- Do Draw accessible at `#/draw-prep`
- Shareable URLs, browser back/forward, and bookmarks now work
- Ready for nested routes (e.g. `#/draw-prep/:id`)

## 2026-05-09 — Modernize toolchain

- Upgraded to Svelte 5 (runes), Vite 6, Tailwind CSS 4
- Removed svetamat dependency — replaced with lightweight Btn.svelte + plain HTML
- Migrated all components to Svelte 5 runes ($props, $state, $derived, $effect)
- Replaced self-hosted fonts with Google Fonts CDN
- Replaced elevation classes with Tailwind shadow utilities
- Added component tests with @testing-library/svelte (71 tests total)
- Added svelte-check for type checking
- Clean build with zero errors

## 2026-05-09 — Event name for Draw Prep

- Optional event name field in Draw Prep setup
- Event name shown in groups heading (e.g. "U13 Boys Singles — Groups (4)")
- Export filename includes event name and timestamp (e.g. `draw-U13 Boys Singles-2026-05-09 14-30.json`)
- Event name preserved on import and auto-restore
- Improved setup form layout with consistent label-above fields


## 2025-05-05 — Mobile-responsive Draw Prep layout

- Bottom tab bar navigation on mobile for DrawPrep page
- Chart sub-tabs (Quarter / Semi / Final) on mobile
- Removed footer from App.svelte

## 2025-05-03 — Draw Preparation feature

- New "Draw Preparation" page with group-based knockout draw workflow
- Group cards with winner/runner-up input fields and position dropdowns
- Runner-up half constraint and cascade on winner reposition
- Live KO chart preview (DrawPrepChart)
- Export to JSON / Import from JSON
- Auto-save to localStorage with 7-day expiry
- Unit tests for storage and position derivation logic

## 2025-05-02 — Remove backend

- Removed backend/API dependencies; app is now a pure static site
- Deployed as Firebase Hosting static site

# Changelog

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

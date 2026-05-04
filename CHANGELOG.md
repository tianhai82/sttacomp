# Changelog

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

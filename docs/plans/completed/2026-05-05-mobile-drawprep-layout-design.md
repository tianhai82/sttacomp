# Mobile-responsive DrawPrep layout

## Problem

On mobile, the DrawPrep page is unusable:
- The two-panel layout (groups form + KO chart) stacks vertically, requiring excessive scrolling
- The DrawPrepChart uses fixed `w-64` columns that overflow on small screens
- Group count varies from 2 to 64, so both panels can be very tall
- Both editing (groups) and viewing (chart) need frequent mobile access

The Draw (calculator) page is fine on mobile — no changes needed there.

## Solution

### 1. Remove footer from App.svelte

The footer (`fixed bottom-0`) only contains Flaticon icon attribution. Remove it to free up the bottom edge for the tab bar. Attribution can be moved to a small link elsewhere if needed.

### 2. Bottom tab bar in DrawPrep.svelte

Add a fixed bottom tab bar with two tabs — **Groups** and **KO Chart** — visible only on mobile (`flex md:hidden`).

- Active tab: `text-red-600 border-t-2 border-red-600`
- Inactive tab: `text-gray-500`
- Fixed `bottom-0`, `z-40`, full width, white background with top border
- `py-3` per button for comfortable thumb targets

### 3. Show/hide panels based on mobileTab

Add a `mobileTab` state variable (`'groups' | 'chart'`) in DrawPrep.svelte.

- Groups panel: `hidden md:block` when `mobileTab !== 'groups'`
- Chart panel: `hidden md:block` when `mobileTab !== 'chart'`
- Both panels always visible on `md:` and up (desktop unchanged)
- Add `pb-16` to the page container so content doesn't hide behind the tab bar

### 4. Chart sub-tabs in DrawPrepChart.svelte

Add a tab row above the chart content — visible only on mobile — to show one half or quarter at a time.

- For draws ≤ 32 (2 columns): tabs are "Top Half" / "Bottom Half"
- For draws > 32 (4 columns): tabs are "Quarter 1" / "Quarter 2" / "Quarter 3" / "Quarter 4"
- Active sub-tab renders only its column; others hidden
- Desktop: all columns shown side-by-side as now (no sub-tabs)

## Files changed

| File | Change |
|---|---|
| `web/src/App.svelte` | Remove `<footer>` |
| `web/src/pages/DrawPrep.svelte` | Add `mobileTab` state, bottom tab bar, conditional show/hide classes, `pb-16` |
| `web/src/components/DrawPrepChart.svelte` | Add `activeColumn` state, sub-tab row, per-column show/hide |

## Desktop behavior

Zero changes. All mobile-only classes use `md:hidden` / `md:block` / `md:flex` breakpoints. The existing side-by-side layout is the desktop default.

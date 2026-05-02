# Knockout Chart Style Consistency

## Problem

The knockout chart uses a dark green background with custom CSS, while the rest of the app uses a clean white/light theme with Tailwind utility classes and `elevation-3` cards. The visual disconnect is jarring.

## Solution

Restyle `SplitDraw.svelte` to use Tailwind classes matching the existing app theme — light backgrounds, gray borders, elevation shadows.

## Changes

### SplitDraw.svelte

Replace all custom `<style>` CSS with Tailwind utility classes on the markup elements:

| Element | Current (dark) | New (light) |
|---------|---------------|-------------|
| Column label | `color: #eee` | `text-gray-700 font-bold text-sm tracking-wide uppercase` |
| Quarter | `rgba(255,255,255,0.05)` bg + rgba border | `border border-gray-300 rounded-lg p-2` |
| Eighth | `rgba(0,0,0,0.2)` bg | `bg-gray-50 rounded p-1` |
| Group of 4 | White gradient + dark shadow | `bg-white border border-gray-200 rounded shadow-sm` |
| Player divider | `border-top: 1px solid #cbd5e1` | `border-t border-gray-100` |
| Position badge | Yellow gradient (`#fde047 → #eab308`) | `bg-gray-100 font-bold border-r border-gray-200` |
| Winner label | `color: #15803d` | `text-green-700` |
| Runner-up label | `color: #c2410c` | `text-orange-700` |
| BYE label | `color: #64748b italic` | `text-gray-400 italic` |

Remove the entire `<style>` block — all styling moves to Tailwind classes in the template.

### Draw.svelte

Change the chart wrapper from:
```
style="background: radial-gradient(circle at center, #233c2d 0%, #101c15 100%);"
```
To:
```
class="bg-white"
```

This matches the other cards in the page (`elevation-3 rounded-lg` is already on the wrapper).

## No other changes

- No API changes
- No structural/layout changes
- No new dependencies
- Column count logic (2 vs 4 columns) stays the same

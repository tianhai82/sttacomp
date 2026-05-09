# Event Name for Draw Prep

## Context

Users manage 2-4 events per tournament session (e.g. "U13 Boys Singles", "Open Doubles"). Currently the app only handles one draw at a time — you must finish one before starting the next. Exported files are named `draw-prep-1715234567890.json`, making it hard to identify which event is which.

## Decision

Add an event name field to Draw Prep. The exported filename includes the event name and local datetime, so users can manage multiple events through files (export one, import another). No new architecture — the file system is the event manager.

---

## Slice 1: Event name input and storage

**Files:** `types.ts`, `DrawPrep.svelte`

- Add `eventName: string` to `DrawPrepState`
- Add a text input to the setup screen (alongside "Number of groups")
- Include `eventName` in `buildState()` — defaults to empty string if blank
- Show the event name as the heading (e.g. "Groups (8)" → "U13 Boys Singles — Groups (8)") when set, fall back to current heading when empty

**Import validation:** When importing, read `eventName` from the JSON file (optional field for backward compat — default to empty string if missing).

---

## Slice 2: Export filename with event name and local datetime

**Files:** `DrawPrep.svelte`

- Change export filename from `draw-prep-${Date.now()}.json` to `draw-${eventName}-${localDatetime}.json`
- `localDatetime` formatted as `YYYY-MM-DD HH-mm` using `Intl.DateTimeFormat` in local timezone
- If `eventName` is empty, use `"draw"` as prefix (e.g. `draw-2026-05-09 14-30.json`)
- Sanitize event name for filename (replace special chars with spaces, collapse whitespace)

Example outputs:
```
draw-U13 Boys Singles-2026-05-09 14-30.json
draw-Open Doubles-2026-05-09 14-35.json
draw-2026-05-09 14-40.json          (no event name)
```

---

## Slice 3: Event name in JSON export

**Files:** `DrawPrep.svelte`

- Include `eventName` in the exported JSON alongside `numGroups` and `groups`
- On import, restore `eventName` from the file

Example export:
```json
{
  "eventName": "U13 Boys Singles",
  "numGroups": 8,
  "groups": [...]
}
```

---

## Not in scope

- Multi-event tab UI
- Event dashboard/listing page
- Cloud storage or sharing
- Auto-save key changes (localStorage stays as-is per state instance)

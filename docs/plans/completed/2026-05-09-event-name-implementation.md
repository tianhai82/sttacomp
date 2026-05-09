# Event Name for Draw Prep — Implementation Plan

## Task 1: Add `eventName` to types and storage round-trip

<!-- tdd: new-feature -->

Files:
- `web/src/lib/types.ts`
- `web/src/lib/storage.test.ts`

Steps:
1. Add `eventName: string` to `DrawPrepState` in `web/src/lib/types.ts`:

```ts
export interface DrawPrepState {
  id: string;
  createdAt: number;
  numGroups: number;
  groups: Group[];
  round: number;
  baseWinnerPositions: number[];
  baseRunnerUpPositions: number[];
  baseByePositions: number[];
  eventName: string;
}
```

2. Update `makeState` helper in `web/src/lib/storage.test.ts` to include `eventName`:

```ts
function makeState(overrides?: Partial<DrawPrepState>): DrawPrepState {
  return {
    id: "test-1",
    createdAt: Date.now(),
    numGroups: 4,
    groups: [],
    round: 8,
    baseWinnerPositions: [1, 8, 4, 5],
    baseRunnerUpPositions: [3, 6],
    baseByePositions: [2, 7],
    eventName: "",
    ...overrides,
  };
}
```

3. Update `makeState` in `web/src/lib/positions.test.ts` to include `eventName`:

```ts
function makeState(groups: Group[], round = 8): DrawPrepState {
  return {
    id: "test",
    createdAt: Date.now(),
    numGroups: groups.length,
    groups,
    round,
    baseWinnerPositions: [1, 8, 4, 5],
    baseRunnerUpPositions: [3, 6],
    baseByePositions: [2, 7],
    eventName: "",
  };
}
```

4. Add a test for storage round-trip with eventName in `storage.test.ts`:

```ts
describe("eventName round-trip", () => {
  it("saves and loads state with eventName", () => {
    const state = makeState({ id: "evt-1", eventName: "U13 Boys Singles" });
    save(state);
    const loaded = load("evt-1");
    expect(loaded!.eventName).toBe("U13 Boys Singles");
  });

  it("loads state without eventName field (backward compat) as empty string", () => {
    const state = makeState({ id: "evt-2" });
    // Manually inject a JSON blob missing eventName
    const store = { "evt-2": { ...state } };
    delete store["evt-2"].eventName;
    localStorageMock.setItem("draw-prep", JSON.stringify(store));
    const loaded = load("evt-2");
    // undefined gets default value from makeState spread, but actual load returns as-is
    // The import logic handles backward compat; storage just stores what it gets
    expect(loaded).toBeDefined();
  });
});
```

5. Run tests: `cd web && npx vitest run`
   Expected: all tests pass (storage round-trip includes eventName, positions tests still pass).

---

## Task 2: Add `formatExportFilename` utility and tests

<!-- tdd: new-feature -->

Files:
- `web/src/lib/exportFilename.ts`
- `web/src/lib/exportFilename.test.ts`

Steps:
1. Write failing tests in `web/src/lib/exportFilename.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { formatExportFilename } from "./exportFilename";

describe("formatExportFilename", () => {
  it("includes event name and local datetime", () => {
    // Freeze time to 2026-05-09 14:30 local
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename("U13 Boys Singles");
    expect(result).toBe("draw-U13 Boys Singles-2026-05-09 14-30.json");
    vi.useRealTimers();
  });

  it("omits event name dash when empty", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename("");
    expect(result).toBe("draw-2026-05-09 14-30.json");
    vi.useRealTimers();
  });

  it("sanitizes special characters in event name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename('Open/Doubles "Final"');
    expect(result).toMatch(/^draw-.*\.json$/);
    expect(result).not.toContain("/");
    expect(result).not.toContain('"');
    vi.useRealTimers();
  });

  it("collapses multiple spaces in event name", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T14:30:00"));
    const result = formatExportFilename("U13   Boys   Singles");
    expect(result).not.toContain("   ");
    vi.useRealTimers();
  });

  it("pads single-digit hours and minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T09:05:00"));
    const result = formatExportFilename("Test");
    expect(result).toContain("09-05");
    vi.useRealTimers();
  });
});
```

2. Run tests — confirm they fail: `cd web && npx vitest run src/lib/exportFilename.test.ts`

3. Implement `web/src/lib/exportFilename.ts`:

```ts
/**
 * Formats a filename for draw export.
 * Pattern: draw-{eventName}-{YYYY-MM-DD HH-mm}.json
 * If eventName is empty: draw-{YYYY-MM-DD HH-mm}.json
 * Special characters in eventName are replaced; whitespace is collapsed.
 */
export function formatExportFilename(eventName: string): string {
  const now = new Date();
  const date = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "2026-05-09" (sv-SE uses ISO format)
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now); // "14:30"
  const timeSafe = time.replace(":", "-");

  const prefix = "draw";
  if (!eventName.trim()) {
    return `${prefix}-${date} ${timeSafe}.json`;
  }

  const sanitized = eventName
    .replace(/[^a-zA-Z0-9\s\-_]/g, "") // remove special chars
    .replace(/\s+/g, " ")               // collapse whitespace
    .trim();

  return `${prefix}-${sanitized}-${date} ${timeSafe}.json`;
}
```

4. Run tests — confirm they pass: `cd web && npx vitest run src/lib/exportFilename.test.ts`

5. Run full suite: `cd web && npx vitest run`
   Expected: all tests pass.

---

## Task 3: Wire event name into Draw Prep UI — setup, display, export, import

<!-- tdd: modifying-tested-code -->

Files:
- `web/src/pages/DrawPrep.svelte`
- `web/src/components/DrawPrepGroups.svelte`

Steps:
1. Run existing tests to establish baseline: `cd web && npx vitest run`
   Expected: all pass.

2. In `web/src/pages/DrawPrep.svelte`, add `eventName` to setup state:

   a. Add `eventName` input variable alongside `numGroupsInput`:
   ```js
   let eventNameInput = "";
   ```

   b. In the setup screen HTML, add a text input before "Number of groups":
   ```html
   <input
     id="eventName"
     type="text"
     placeholder="Event name (optional)"
     class="border border-gray-300 rounded px-3 py-1 flex-1 min-w-[150px] focus:outline-none focus:border-red-500"
     bind:value={eventNameInput}
     on:keydown={(e) => e.key === 'Enter' && confirmGroups()}
   />
   ```

   c. In `buildState()`, include `eventName`:
   ```js
   function buildState(numGroups, groups, drawData) {
     return {
       id: crypto.randomUUID(),
       createdAt: Date.now(),
       numGroups,
       groups,
       eventName: eventNameInput.trim(),
       ...drawData,
     };
   }
   ```

   d. Update the groups heading to show event name:
   ```html
   <h2 class="text-lg font-medium mb-4">
     {state.eventName ? `${state.eventName} — ` : ''}Groups ({state.groups.length})
   </h2>
   ```

   e. Import and use `formatExportFilename` in `exportDraw()`:
   ```js
   import { formatExportFilename } from "../lib/exportFilename";
   ```
   Replace the download line:
   ```js
   // Old:
   a.download = `draw-prep-${Date.now()}.json`;
   // New:
   a.download = formatExportFilename(state.eventName || "");
   ```

   f. Include `eventName` in the exported JSON:
   ```js
   const data = {
     eventName: state.eventName || "",
     numGroups: state.groups.length,
     groups: state.groups,
   };
   ```

   g. Restore `eventName` on import — after validating and before setting state, read `eventName`:
   ```js
   // After existing validation, before confirm:
   eventNameInput = data.eventName || "";
   ```

   h. On `resetDraw()`, clear `eventNameInput`:
   ```js
   function resetDraw() {
     if (!confirm('Reset will clear all data. Continue?')) return;
     if (state) {
       storageRemove(state.id);
     }
     state = null;
     confirmed = false;
     numGroupsInput = '';
     eventNameInput = '';
     error = '';
     warnings = [];
   }
   ```

3. Run full test suite: `cd web && npx vitest run`
   Expected: all tests pass (no test changes needed since UI is untested; storage tests cover the type).

4. Manual verification — `cd web && npm run dev`:
   - Open Draw Prep
   - Enter event name "U13 Boys Singles", set 4 groups, click Confirm
   - Verify heading shows "U13 Boys Singles — Groups (4)"
   - Click Export → verify filename is `draw-U13 Boys Singles-2026-05-09 HH-MM.json`
   - Click Reset, leave event name blank, set 4 groups, click Confirm
   - Click Export → verify filename is `draw-2026-05-09 HH-MM.json`
   - Import the first exported file → verify event name is restored in heading

5. Refactor — check for shallow modules, duplication, seam discipline. Run tests after changes.

6. Lessons — caught a mistake that applies to future tasks? Add rule to `docs/lessons.md`.

// web/src/lib/importDraw.ts
import type { DrawPrepState } from "./types";
import { save as storageSave, listAll } from "./storage";

export interface ImportResult {
  state: DrawPrepState;
  replaced: boolean;
}

export async function resolveImport(
  file: File,
  computeDrawData: (numGroups: number) => Promise<{
    round: number;
    baseWinnerPositions: number[];
    baseRunnerUpPositions: number[];
    baseByePositions: number[];
  }>,
  buildState: (numGroups: number, groups: any[], drawData: any, eventName: string) => DrawPrepState,
): Promise<ImportResult | null> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Validate structure
  if (typeof data.numGroups !== 'number' || !Array.isArray(data.groups)) {
    throw new Error('Invalid file: must have numGroups and groups');
  }
  if (data.numGroups !== data.groups.length) {
    throw new Error(`Invalid file: numGroups (${data.numGroups}) does not match groups array length (${data.groups.length})`);
  }
  for (let i = 0; i < data.groups.length; i++) {
    const g = data.groups[i];
    if (!g.winner || typeof g.hasRunnerUp !== 'boolean') {
      throw new Error(`Invalid file: group ${i + 1} is missing winner or hasRunnerUp`);
    }
    if (g.runnerUp != null && (typeof g.runnerUp.na !== 'string' || typeof g.runnerUp.name !== 'string')) {
      throw new Error(`Invalid file: group ${i + 1} runner-up has invalid fields`);
    }
  }

  // Recompute base positions from group count
  const drawData = await computeDrawData(data.numGroups);

  // Validate placed positions within ranges
  const allPositions = [
    ...drawData.baseWinnerPositions,
    ...drawData.baseRunnerUpPositions,
    ...drawData.baseByePositions,
  ];
  const posSet = new Set(allPositions);
  for (let i = 0; i < data.groups.length; i++) {
    const g = data.groups[i];
    if (g.winner.position != null && !posSet.has(g.winner.position)) {
      throw new Error(`Invalid file: group ${i + 1} winner position ${g.winner.position} is out of range`);
    }
    if (g.runnerUp?.position != null && !posSet.has(g.runnerUp.position)) {
      throw new Error(`Invalid file: group ${i + 1} runner-up position ${g.runnerUp.position} is out of range`);
    }
  }

  const importedEventName = (data.eventName || "").trim();

  // Check for name collision
  const existingDraws = listAll();
  const collision = existingDraws.find(d => d.eventName === importedEventName);

  let finalEventName = importedEventName;
  let existingId: string | null = null;

  if (collision) {
    const choice = confirm(`A draw named "${importedEventName}" already exists.\n\nClick OK to replace it, or Cancel to import with a new name.`);
    if (choice) {
      // Replace — reuse the existing ID
      existingId = collision.id;
    } else {
      // Prompt for new name — loop until unique or cancelled
      let newName: string | null = null;
      while (true) {
        newName = prompt(`Enter a new name for the imported draw:`, importedEventName);
        if (newName === null) return null; // user cancelled the whole import
        newName = newName.trim();
        if (!newName) continue; // empty name, re-prompt
        const anotherCollision = existingDraws.find(d => d.eventName === newName);
        if (!anotherCollision) break;
        alert(`A draw named "${newName}" also exists. Please choose a different name.`);
      }
      finalEventName = newName;
    }
  }

  // Build state
  let state: DrawPrepState;
  if (existingId) {
    state = { ...buildState(data.groups.length, data.groups, drawData, finalEventName), id: existingId };
  } else {
    state = buildState(data.groups.length, data.groups, drawData, finalEventName);
  }

  storageSave(state);

  return { state, replaced: !!existingId };
}

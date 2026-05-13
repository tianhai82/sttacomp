// web/src/lib/storage.ts
import type { DrawPrepState, DrawSummary } from "./types";

const STORAGE_KEY = "draw-prep";
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function getStore(): Record<string, DrawPrepState & { createdAt: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setStore(store: Record<string, DrawPrepState & { createdAt: number }>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isExpired(createdAt: number): boolean {
  return Date.now() - createdAt > EXPIRY_MS;
}

export function save(state: DrawPrepState): void {
  const store = getStore();
  store[state.id] = state;
  setStore(store);
}

export function load(id: string): DrawPrepState | null {
  const store = getStore();
  const entry = store[id];
  if (!entry) return null;
  if (isExpired(entry.createdAt)) {
    // Purge expired entry
    delete store[id];
    setStore(store);
    return null;
  }
  return entry;
}

export function loadAll(): Record<string, DrawPrepState> {
  const store = getStore();
  let changed = false;
  for (const [id, entry] of Object.entries(store)) {
    if (isExpired(entry.createdAt)) {
      delete store[id];
      changed = true;
    }
  }
  if (changed) {
    setStore(store);
  }
  return store;
}

export function remove(id: string): void {
  const store = getStore();
  delete store[id];
  setStore(store);
}

export function loadMostRecent(): DrawPrepState | null {
  const all = loadAll();
  const entries = Object.values(all);
  if (entries.length === 0) return null;
  return entries.reduce((mostRecent, entry) =>
    entry.createdAt > mostRecent.createdAt ? entry : mostRecent
  );
}

export function listAll(): DrawSummary[] {
  const store = getStore();
  let changed = false;
  const summaries: DrawSummary[] = [];
  for (const [id, entry] of Object.entries(store)) {
    if (isExpired(entry.createdAt)) {
      delete store[id];
      changed = true;
    } else {
      summaries.push({
        id: entry.id,
        eventName: entry.eventName || "",
        numGroups: entry.numGroups,
        createdAt: entry.createdAt,
      });
    }
  }
  if (changed) {
    setStore(store);
  }
  return summaries.sort((a, b) => b.createdAt - a.createdAt);
}


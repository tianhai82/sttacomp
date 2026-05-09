<!-- web/src/pages/DrawPrep.svelte -->
<script>
  import Btn from "../components/Btn.svelte";
  import { calculateDraws } from "../lib/calculateDraw";
  import DrawPrepChart from "../components/DrawPrepChart.svelte";
  import DrawPrepGroups from "../components/DrawPrepGroups.svelte";
  import { getOccupiedPositions, getAvailablePositions, deriveActivePositions, isInOppositeHalf, clearInvalidRunnerUps } from "../lib/positions";
  import { save as storageSave, remove as storageRemove, loadAll, loadMostRecent } from "../lib/storage";
  import { formatExportFilename } from "../lib/exportFilename";
  import { onMount, onDestroy } from "svelte";

  let numGroupsInput = "";
  let eventNameInput = "";
  let fileInput;
  let confirmed = false;
  let error = "";
  let warnings = [];
  let mobileTab = 'groups'; // 'groups' | 'chart'
  let state = null; // DrawPrepState | null

  // Occupied positions derived reactively from groups
  $: occupiedPositions = state ? getOccupiedPositions(state.groups) : new Set();

  // Active positions (reactive) — accounts for groups without runner-ups
  $: activePositions = state ? deriveActivePositions(state) : null;

  // Available winner positions: base winners minus occupied
  $: availableWinnerPositions = state
    ? getAvailablePositions(state.baseWinnerPositions, occupiedPositions)
    : [];

  // Available runner-up positions per group: active runner-ups minus occupied, filtered by opposite half
  $: availableRunnerUpPositionsPerGroup = state && activePositions
    ? state.groups.map(group => {
        if (group.winner.position === null) return [];
        return getAvailablePositions(activePositions.runnerups, occupiedPositions)
          .filter(pos => isInOppositeHalf(pos, group.winner.position, state.round))
          .sort((a, b) => a - b);
      })
    : [];

  function playerLabel(player, fallback) {
    const name = player.name || fallback;
    return player.na ? `${name} (${player.na})` : name;
  }

  // Placed players map for the chart: position -> {name, na, type}
  $: placedPlayers = state
    ? (() => {
        const map = new Map();
        state.groups.forEach((group, idx) => {
          if (group.winner.position !== null) {
            map.set(group.winner.position, {
              name: group.winner.name || `Winner (Group ${idx + 1})`,
              na: group.winner.na,
              type: 'winner',
              label: playerLabel(group.winner, `Winner (Group ${idx + 1})`),
            });
          }
          const ruPos = group.runnerUp?.position;
          if (ruPos != null) {
            map.set(ruPos, {
              name: group.runnerUp.name || `Runner-up (Group ${idx + 1})`,
              na: group.runnerUp.na,
              type: 'runnerup',
              label: playerLabel(group.runnerUp, `Runner-up (Group ${idx + 1})`),
            });
          }
        });
        return map;
      })()
    : new Map();

  $: chartProps = state && activePositions
    ? {
        round: state.round,
        winners: activePositions.winners,
        runnerups: activePositions.runnerups,
        byes: activePositions.byes,
        placedPlayers,
      }
    : null;

  const EMPTY_PLAYER = { na: "", name: "", position: null };

  function makeEmptyGroups(count) {
    return Array.from({ length: count }, () => ({
      winner: { ...EMPTY_PLAYER },
      hasRunnerUp: true,
      runnerUp: { ...EMPTY_PLAYER },
    }));
  }

  async function confirmGroups() {
    const num = parseInt(numGroupsInput, 10);
    if (!num || num < 1 || num > 128) {
      error = "Group count must be between 1 and 128";
      return;
    }
    error = "";

    try {
      const data = await computeDrawData(num);
      state = buildState(num, makeEmptyGroups(num), data);
      confirmed = true;
    } catch (e) {
      error = e.message || "Failed to calculate draw";
    }
  }

  function onSetupFileSelected(e) {
    const file = e.target.files[0];
    if (file) importDraw(file);
    e.target.value = '';
  }

  function handleGroupsChange(newGroups) {
    let finalGroups = newGroups;

    // Cascade: check if any runner-up positions became invalid
    if (state) {
      const tempState = { ...state, groups: finalGroups };
      const active = deriveActivePositions(tempState);
      const { groups: clearedGroups, cleared } = clearInvalidRunnerUps(finalGroups, active, state.round);

      if (cleared.length > 0) {
        finalGroups = clearedGroups;
        warnings = cleared.map(i => `Group ${i + 1} runner-up position cleared (no longer valid)`);
        setTimeout(() => { warnings = []; }, 4000);
      }
    }

    state = { ...state, groups: finalGroups };
  }

  async function importDraw(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (typeof data.numGroups !== 'number' || !Array.isArray(data.groups)) {
        error = 'Invalid file: must have numGroups and groups';
        return;
      }
      if (data.numGroups !== data.groups.length) {
        error = `Invalid file: numGroups (${data.numGroups}) does not match groups array length (${data.groups.length})`;
        return;
      }
      for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i];
        if (!g.winner || typeof g.hasRunnerUp !== 'boolean') {
          error = `Invalid file: group ${i + 1} is missing winner or hasRunnerUp`;
          return;
        }
        if (g.runnerUp != null && (typeof g.runnerUp.na !== 'string' || typeof g.runnerUp.name !== 'string')) {
          error = `Invalid file: group ${i + 1} runner-up has invalid fields`;
          return;
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
          error = `Invalid file: group ${i + 1} winner position ${g.winner.position} is out of range`;
          return;
        }
        if (g.runnerUp?.position != null && !posSet.has(g.runnerUp.position)) {
          error = `Invalid file: group ${i + 1} runner-up position ${g.runnerUp.position} is out of range`;
          return;
        }
      }

      if (!confirm('Importing will replace the current draw. Continue?')) return;

      eventNameInput = data.eventName || "";
      state = buildState(data.groups.length, data.groups, drawData);
      confirmed = true;
      error = '';
      warnings = [];
    } catch (e) {
      error = 'Failed to import: ' + (e.message || 'unknown error');
    }
  }

  function exportDraw() {
    if (!state) return;
    const data = {
      eventName: state.eventName || "",
      numGroups: state.groups.length,
      groups: state.groups,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = formatExportFilename(state.eventName || "");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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

  // Auto-save: debounce and save on state change
  let saveTimeout;
  $: if (state) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      storageSave(state);
    }, 500);
  }

  // Clean up auto-save timeout on destroy
  onDestroy(() => {
    clearTimeout(saveTimeout);
  });

  async function computeDrawData(numGroups) {
    const data = await calculateDraws({ winners: numGroups, runnerups: numGroups });
    return {
      round: data.rounds,
      baseWinnerPositions: [...data.winners].sort((a, b) => a - b),
      baseRunnerUpPositions: [...data.runnerups],
      baseByePositions: [...data.byes].sort((a, b) => a - b),
    };
  }

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

  // On mount: purge expired entries and load most recent state
  onMount(async () => {
    loadAll(); // purge expired
    const recent = loadMostRecent();
    if (!recent) return;

    try {
      const drawData = await computeDrawData(recent.groups.length);
      state = { ...recent, ...drawData };
      eventNameInput = recent.eventName || "";
      confirmed = true;
    } catch (e) {
      storageRemove(recent.id);
    }
  });
</script>

<div class="container mx-auto pt-3 px-3 flex flex-col h-[calc(100vh-3rem)] pb-14 md:pb-0">
  {#if !confirmed}
    <div class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-white">
      <h2 class="text-lg font-medium mb-4">Draw Preparation Setup</h2>
      <div class="mb-3">
        <label class="block text-gray-700 font-medium mb-1" for="eventName">Event name</label>
        <input
          id="eventName"
          type="text"
          placeholder="e.g. U13 Boys Singles"
          class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
          bind:value={eventNameInput}
          on:keydown={(e) => e.key === 'Enter' && confirmGroups()}
        />
      </div>
      <div class="mb-3">
        <label class="block text-gray-700 font-medium mb-1" for="numGroups">Number of groups</label>
        <input
          id="numGroups"
          type="number"
          min="1"
          max="128"
          class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
          bind:value={numGroupsInput}
          on:keydown={(e) => e.key === 'Enter' && confirmGroups()}
        />
      </div>
      <div class="flex items-center gap-3">
        <Btn cls="bg-red-500 text-white" onclick={confirmGroups}>
          Confirm
        </Btn>
        <Btn cls="bg-gray-500 text-white" onclick={() => fileInput.click()}>>
          Import
        </Btn>
        <input bind:this={fileInput} type="file" accept=".json" class="hidden" on:change={onSetupFileSelected} />
      </div>
      {#if error}
        <div class="text-red-600 text-sm">{error}</div>
      {/if}
    </div>
  {:else if state}
    {#if warnings.length > 0}
      <div class="mx-2 mb-2">
        {#each warnings as warning}
          <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded px-3 py-2 mb-1">
            ⚠ {warning}
          </div>
        {/each}
      </div>
    {/if}
    <div class="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
      <!-- Left panel: Groups form -->
      <div class="md:w-1/2 overflow-y-auto min-h-0 {mobileTab === 'groups' ? '' : 'hidden md:block'}">
        <div class="rounded-lg mx-2 p-4 shadow-md bg-white">
          <h2 class="text-lg font-medium mb-4">
            {state.eventName ? `${state.eventName} — ` : ''}Groups ({state.groups.length})
          </h2>
          <DrawPrepGroups
            groups={state.groups}
            availableWinnerPositions={availableWinnerPositions}
            availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
            onChange={handleGroupsChange}
            onExport={exportDraw}
            onImport={importDraw}
            onReset={resetDraw}
          />
        </div>
      </div>
      <!-- Right panel: KO Chart -->
      <div class="md:w-1/2 overflow-y-auto min-h-0 {mobileTab === 'chart' ? '' : 'hidden md:block'}">
        <div class="rounded-lg mx-2 py-4 px-4 overflow-x-auto bg-white">
          <h2 class="text-lg font-medium mb-4">Knockout Chart</h2>
          <DrawPrepChart {...chartProps} />
        </div>
      </div>
    </div>
  {/if}

  <!-- Mobile bottom tab bar -->
  {#if confirmed && state}
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex md:hidden z-40">
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'groups'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        on:click={() => (mobileTab = 'groups')}>
        Groups
      </button>
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'chart'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        on:click={() => (mobileTab = 'chart')}>
        KO Chart
      </button>
    </div>
  {/if}
</div>

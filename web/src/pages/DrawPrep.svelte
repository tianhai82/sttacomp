<!-- web/src/pages/DrawPrep.svelte -->
<script>
  import Btn from "../components/Btn.svelte";
  import { calculateDraws } from "../lib/calculateDraw";
  import DrawPrepChart from "../components/DrawPrepChart.svelte";
  import DrawPrepGroups from "../components/DrawPrepGroups.svelte";
  import DrawList from "../components/DrawList.svelte";
  import { getOccupiedPositions, getAvailablePositions, deriveActivePositions, isInOppositeHalf, clearInvalidRunnerUps } from "../lib/positions";
  import { save as storageSave, remove as storageRemove, loadAll, load as storageLoad, listAll } from "../lib/storage";
  import { formatExportFilename } from "../lib/exportFilename";
  import { resolveImport } from "../lib/importDraw";
  import { push } from "svelte-spa-router";
  import { onDestroy } from "svelte";

  let { params = {} } = $props();

  let numGroupsInput = $state("");
  let eventNameInput = $state("");
  let confirmed = $state(false);
  let error = $state("");
  let warnings = $state([]);
  let mobileTab = $state('groups'); // 'groups' | 'chart'
  let state = $state(null); // DrawPrepState | null
  let showSetup = $state(false);
  let draws = $state([]); // DrawSummary[]

  // Derive view from route params
  let view = $derived(params.id ? 'editing' : 'list');

  // Occupied positions derived reactively from groups
  let occupiedPositions = $derived(state ? getOccupiedPositions(state.groups) : new Set());

  // Active positions (reactive) — accounts for groups without runner-ups
  let activePositions = $derived(state ? deriveActivePositions(state) : null);

  // Available winner positions: base winners minus occupied
  let availableWinnerPositions = $derived(
    state
      ? getAvailablePositions(state.baseWinnerPositions, occupiedPositions)
      : []
  );

  // Available runner-up positions per group: active runner-ups minus occupied, filtered by opposite half
  let availableRunnerUpPositionsPerGroup = $derived(
    state && activePositions
      ? state.groups.map(group => {
          if (group.winner.position === null) return [];
          return getAvailablePositions(activePositions.runnerups, occupiedPositions)
            .filter(pos => isInOppositeHalf(pos, group.winner.position, state.round))
            .sort((a, b) => a - b);
        })
      : []
  );

  function playerLabel(player, fallback) {
    const name = player.name || fallback;
    return player.na ? `${name} (${player.na})` : name;
  }

  // Placed players map for the chart: position -> {name, na, type, label}
  let placedPlayers = $derived(
    state
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
      : new Map()
  );

  let chartProps = $derived(
    state && activePositions
      ? {
          round: state.round,
          winners: activePositions.winners,
          runnerups: activePositions.runnerups,
          byes: activePositions.byes,
          placedPlayers,
        }
      : null
  );

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
      storageSave(state);
      showSetup = false;
      push(`/draw-prep/draw/${state.id}`);
    } catch (e) {
      error = e.message || "Failed to calculate draw";
    }
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
    error = '';
    try {
      const result = await resolveImport(file, computeDrawData, buildState);
      if (!result) return; // user cancelled
      state = result.state;
      push(`/draw-prep/draw/${result.state.id}`);
      warnings = [];
    } catch (e) {
      error = e.message || 'Failed to import';
    }
  }

  let importFileInput = $state();

  function triggerFileImport() {
    importFileInput.click();
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    if (file) importDraw(file);
    e.target.value = '';
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
    if (!confirm('Delete this draw? This cannot be undone.')) return;
    if (state) {
      storageRemove(state.id);
    }
    state = null;
    push('/draw-prep');
  }

  // Auto-save: debounce via $effect with cleanup
  $effect(() => {
    if (state) {
      const timeout = setTimeout(() => {
        storageSave(state);
      }, 500);
      return () => clearTimeout(timeout);
    }
  });

  // Flush save on component destruction
  onDestroy(() => {
    if (state) storageSave(state);
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

  function buildState(numGroups, groups, drawData, eventName) {
    return {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      numGroups,
      groups,
      eventName: typeof eventName === 'string' ? eventName : eventNameInput.trim(),
      ...drawData,
    };
  }

  // Reactive: load data based on route
  $effect(() => {
    const id = params.id;
    if (id) {
      loadDrawById(id);
    } else {
      draws = listAll();
    }
  });

  async function loadDrawById(id) {
    loadAll(); // purge expired
    const loaded = storageLoad(id);
    if (!loaded) {
      push('/draw-prep');
      return;
    }
    try {
      const drawData = await computeDrawData(loaded.groups.length);
      state = { ...loaded, ...drawData };
      eventNameInput = loaded.eventName || "";
    } catch (e) {
      storageRemove(id);
      push('/draw-prep');
    }
  }

  function openDraw(id) {
    push(`/draw-prep/draw/${id}`);
  }

  function newDraw() {
    state = null;
    confirmed = false;
    numGroupsInput = '';
    eventNameInput = '';
    error = '';
    warnings = [];
    showSetup = true;
  }

  function deleteDraw(id) {
    storageRemove(id);
    draws = listAll();
  }

  function backToList() {
    if (state) storageSave(state);
    state = null;
    confirmed = false;
    push('/draw-prep');
  }
</script>

<div class="container mx-auto pt-3 px-3 flex flex-col h-[calc(100vh-3rem)] pb-14 md:pb-0">
  {#if view === 'editing' && state}
    {#if warnings.length > 0}
      <div class="mx-2 mb-2">
        {#each warnings as warning}
          <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded px-3 py-2 mb-1">
            ⚠ {warning}
          </div>
        {/each}
      </div>
    {/if}
    <div class="flex items-center justify-between mx-2 mb-2">
      <button
        class="text-sm text-red-600 hover:text-red-800 font-medium"
        onclick={backToList}
      >
        ← Back to My Draws
      </button>
      <button
        class="text-gray-400 hover:text-red-500 transition-colors"
        onclick={resetDraw}
        title="Delete draw"
      >
        🗑
      </button>
    </div>
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
  {:else}
    <div class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-white">
      {#if showSetup}
        <h2 class="text-lg font-medium mb-4">Draw Preparation Setup</h2>
        <div class="mb-3">
          <label class="block text-gray-700 font-medium mb-1" for="eventName">Event name</label>
          <input
            id="eventName"
            type="text"
            placeholder="e.g. U13 Boys Singles"
            class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
            bind:value={eventNameInput}
            onkeydown={(e) => e.key === 'Enter' && confirmGroups()}
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
            onkeydown={(e) => e.key === 'Enter' && confirmGroups()}
          />
        </div>
        <div class="flex items-center gap-3">
          <Btn cls="bg-red-500 text-white" onclick={confirmGroups}>Confirm</Btn>
          <Btn cls="bg-gray-500 text-white" onclick={() => { showSetup = false; }}>Cancel</Btn>
        </div>
        {#if error}
          <div class="text-red-600 text-sm mt-2">{error}</div>
        {/if}
      {:else}
        <DrawList {draws} onOpen={openDraw} onNew={newDraw} onDelete={deleteDraw} onImport={importDraw} onTriggerFileImport={triggerFileImport} />
      {/if}
    </div>
    <!-- Hidden file input for import -->
    <input bind:this={importFileInput} type="file" accept=".json" class="hidden" onchange={onFileSelected} />
  {/if}

  <!-- Mobile bottom tab bar -->
  {#if view === 'editing' && state}
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex md:hidden z-40">
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'groups'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        onclick={() => (mobileTab = 'groups')}>
        Groups
      </button>
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'chart'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        onclick={() => (mobileTab = 'chart')}>
        KO Chart
      </button>
    </div>
  {/if}
</div>

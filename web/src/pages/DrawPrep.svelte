<!-- web/src/pages/DrawPrep.svelte -->
<script>
  import { Button } from "svetamat";
  import { calculateDraws } from "../lib/calculateDraw";
  import DrawPrepChart from "../components/DrawPrepChart.svelte";
  import DrawPrepGroups from "../components/DrawPrepGroups.svelte";
  import { getOccupiedPositions, getAvailablePositions, deriveActivePositions, isInOppositeHalf, clearInvalidRunnerUps } from "../lib/positions";

  let numGroupsInput = "";
  let confirmed = false;
  let error = "";
  let warnings = [];
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
          .filter(pos => isInOppositeHalf(pos, group.winner.position, state.round));
      })
    : [];

  // Placed players map for the chart: position -> {name, na, type}
  $: placedPlayers = state
    ? (() => {
        const map = new Map();
        for (const group of state.groups) {
          if (group.winner.position !== null) {
            map.set(group.winner.position, {
              name: group.winner.name || `Winner (Group ${state.groups.indexOf(group) + 1})`,
              na: group.winner.na,
              type: 'winner',
            });
          }
          if (group.runnerUp?.position !== null && group.runnerUp?.position !== undefined) {
            map.set(group.runnerUp.position, {
              name: group.runnerUp.name || `Runner-up (Group ${state.groups.indexOf(group) + 1})`,
              na: group.runnerUp.na,
              type: 'runnerup',
            });
          }
        }
        return map;
      })()
    : new Map();

  $: chartProps = state
    ? {
        round: state.round,
        winners: state.baseWinnerPositions,
        runnerups: state.baseRunnerUpPositions,
        byes: state.baseByePositions,
        placedPlayers,
      }
    : null;

  function makeEmptyGroups(count) {
    return Array.from({ length: count }, () => ({
      winner: { na: "", name: "", position: null },
      hasRunnerUp: true,
      runnerUp: null,
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
      const data = await calculateDraws({
        winners: num,
        runnerups: num,
      });

      state = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        numGroups: num,
        groups: makeEmptyGroups(num),
        round: data.rounds,
        baseWinnerPositions: data.winners,
        baseRunnerUpPositions: data.runnerups,
        baseByePositions: data.byes,
      };
      confirmed = true;
    } catch (e) {
      error = e.message || "Failed to calculate draw";
    }
  }

  function handleGroupsChange(e) {
    const newGroups = e.detail.groups;
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

  function exportDraw() {
    if (!state) return;
    const data = {
      numGroups: state.numGroups,
      groups: state.groups,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `draw-prep-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="container mx-auto pt-3 px-3 flex flex-col">
  {#if !confirmed}
    <div class="rounded-lg mt-4 mx-2 p-4 elevation-3 bg-white">
      <h2 class="text-lg font-medium mb-4">Draw Preparation Setup</h2>
      <div class="flex items-center gap-4 mb-4">
        <label class="text-gray-700 font-medium" for="numGroups">Number of groups:</label>
        <input
          id="numGroups"
          type="number"
          min="1"
          max="128"
          class="border border-gray-300 rounded px-3 py-1 w-24 focus:outline-none focus:border-red-500"
          bind:value={numGroupsInput}
          on:keydown={(e) => e.key === 'Enter' && confirmGroups()}
        />
        <Button bgColor="bg-red-500" textColor="text-white" on:click={confirmGroups}>
          Confirm
        </Button>
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
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Left panel: Groups form -->
      <div class="md:w-1/2 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div class="rounded-lg mx-2 p-4 elevation-3 bg-white">
          <h2 class="text-lg font-medium mb-4">
            Groups ({state.numGroups})
          </h2>
          <DrawPrepGroups
            groups={state.groups}
            availableWinnerPositions={availableWinnerPositions}
            availableRunnerUpPositionsPerGroup={availableRunnerUpPositionsPerGroup}
            on:change={handleGroupsChange}
            on:export={exportDraw}
          />
        </div>
      </div>
      <!-- Right panel: KO Chart -->
      <div class="md:w-1/2 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div class="rounded-lg mx-2 py-4 px-4 overflow-x-auto bg-white">
          <h2 class="text-lg font-medium mb-4">Knockout Chart</h2>
          <DrawPrepChart {...chartProps} />
        </div>
      </div>
    </div>
  {/if}
</div>

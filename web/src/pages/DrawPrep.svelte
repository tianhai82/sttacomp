<!-- web/src/pages/DrawPrep.svelte -->
<script>
  import { Button } from "svetamat";
  import { calculateDraws } from "../lib/calculateDraw";
  import DrawPrepChart from "../components/DrawPrepChart.svelte";
  import DrawPrepGroups from "../components/DrawPrepGroups.svelte";
  import type { DrawPrepState, Group } from "../lib/types";

  let numGroupsInput = "";
  let confirmed = false;
  let error = "";
  let state = null; // DrawPrepState | null

  $: chartProps = state
    ? {
        round: state.round,
        winners: state.baseWinnerPositions,
        runnerups: state.baseRunnerUpPositions,
        byes: state.baseByePositions,
        placedPlayers: new Map(),
      }
    : null;

  function makeEmptyGroups(count: number): Group[] {
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
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Left panel: Groups form -->
      <div class="md:w-1/2 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div class="rounded-lg mx-2 p-4 elevation-3 bg-white">
          <h2 class="text-lg font-medium mb-4">
            Groups ({state.numGroups})
          </h2>
          <DrawPrepGroups groups={state.groups} on:change={(e) => { state = { ...state, groups: e.detail.groups }; }} />
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

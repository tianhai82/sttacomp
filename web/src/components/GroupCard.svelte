<!-- web/src/components/GroupCard.svelte -->
<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let group;
  export let groupIndex = 1; // 1-based
  export let availableWinnerPositions = [];
  export let availableRunnerUpPositions = [];

  // Always include currently selected position in dropdown options
  $: winnerSelectOptions = group.winner.position !== null && !availableWinnerPositions.includes(group.winner.position)
    ? [group.winner.position, ...availableWinnerPositions]
    : availableWinnerPositions;

  $: runnerUpSelectOptions = group.runnerUp && group.runnerUp.position !== null && group.runnerUp.position !== undefined
    && !availableRunnerUpPositions.includes(group.runnerUp.position)
    ? [group.runnerUp.position, ...availableRunnerUpPositions]
    : availableRunnerUpPositions;

  // Local bind variables for selects — avoids Svelte index-based reconciliation bug
  let localWinnerPos = '';
  let localRunnerUpPos = '';
  $: {
    const wp = group.winner.position !== null ? String(group.winner.position) : '';
    if (wp !== String(localWinnerPos)) localWinnerPos = wp;
  }
  $: {
    const rp = group.runnerUp && group.runnerUp.position !== null ? String(group.runnerUp.position) : '';
    if (rp !== String(localRunnerUpPos)) localRunnerUpPos = rp;
  }

  function dispatchUpdate(field, value) {
    dispatch("update", { groupIndex: groupIndex - 1, field, value });
  }

  function dispatchWinnerUpdate(field, value) {
    const winner = { ...group.winner, [field]: value };
    dispatch("update", { groupIndex: groupIndex - 1, field: "winner", value: winner });
  }

  function dispatchRunnerUpUpdate(field, value) {
    const runnerUp = group.runnerUp ? { ...group.runnerUp, [field]: value } : { na: "", name: "", position: null, [field]: value };
    dispatch("update", { groupIndex: groupIndex - 1, field: "runnerUp", value: runnerUp });
  }

  function toggleRunnerUp(e) {
    const hasRunnerUp = e.target.checked;
    if (hasRunnerUp) {
      dispatch("update", {
        groupIndex: groupIndex - 1,
        field: "runnerUp",
        value: { na: "", name: "", position: null },
      });
    } else {
      dispatch("update", {
        groupIndex: groupIndex - 1,
        field: "runnerUp",
        value: null,
      });
    }
    dispatch("update", { groupIndex: groupIndex - 1, field: "hasRunnerUp", value: hasRunnerUp });
  }
</script>

<div class="border border-gray-200 rounded-lg p-3 mb-3 shadow-sm">
  <h3 class="font-bold text-sm text-gray-700 mb-2">Group {groupIndex}</h3>

  <!-- Winner row -->
  <div class="flex items-center gap-2 mb-2 flex-wrap">
    <span class="text-xs font-medium text-green-700 w-16">Winner</span>
    <input
      type="text"
      maxlength="3"
      placeholder="NA"
      class="border border-gray-300 rounded px-2 py-1 w-14 text-center text-sm focus:outline-none focus:border-red-500"
      value={group.winner.na}
      on:input={(e) => dispatchWinnerUpdate("na", e.target.value.toUpperCase())}
    />
    <input
      type="text"
      placeholder="Name"
      class="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[100px] text-sm focus:outline-none focus:border-red-500"
      value={group.winner.name}
      on:input={(e) => dispatchWinnerUpdate("name", e.target.value)}
    />
    <select
      class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
      bind:value={localWinnerPos}
      on:change={() => {
        const pos = localWinnerPos === '' ? null : parseInt(localWinnerPos, 10);
        dispatchWinnerUpdate('position', pos);
      }}
    >
      <option value="">Position</option>
      {#each winnerSelectOptions as pos}
        <option value={pos}>{pos}</option>
      {/each}
    </select>
  </div>

  <!-- Runner-up checkbox -->
  <label class="flex items-center gap-2 mb-2 cursor-pointer">
    <input
      type="checkbox"
      checked={group.hasRunnerUp}
      on:change={toggleRunnerUp}
      class="rounded"
    />
    <span class="text-xs text-gray-600">Has runner-up</span>
  </label>

  <!-- Runner-up row -->
  {#if group.hasRunnerUp && group.runnerUp}
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs font-medium text-orange-500 w-16">Runner-up</span>
      <input
        type="text"
        maxlength="3"
        placeholder="NA"
        class="border border-gray-300 rounded px-2 py-1 w-14 text-center text-sm focus:outline-none focus:border-red-500"
        value={group.runnerUp.na}
        on:input={(e) => dispatchRunnerUpUpdate("na", e.target.value.toUpperCase())}
      />
      <input
        type="text"
        placeholder="Name"
        class="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[100px] text-sm focus:outline-none focus:border-red-500"
        value={group.runnerUp.name}
        on:input={(e) => dispatchRunnerUpUpdate("name", e.target.value)}
      />
      <select
        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
        bind:value={localRunnerUpPos}
        on:change={() => {
          const pos = localRunnerUpPos === '' ? null : parseInt(localRunnerUpPos, 10);
          dispatchRunnerUpUpdate('position', pos);
        }}
        disabled={group.winner.position === null}
      >
        <option value="">{group.winner.position === null ? 'Place winner first' : 'Position'}</option>
        {#each runnerUpSelectOptions as pos}
          <option value={pos}>{pos}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

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

  function onWinnerPositionSelect(e) {
    const val = e.target.value;
    dispatchWinnerUpdate("position", val === "" ? null : parseInt(val, 10));
  }

  function onRunnerUpPositionSelect(e) {
    const val = e.target.value;
    dispatchRunnerUpUpdate("position", val === "" ? null : parseInt(val, 10));
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
    {#key availableWinnerPositions.join(",")}
      <select
        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
        value={group.winner.position ?? ""}
        on:change={onWinnerPositionSelect}
      >
        <option value="">Position</option>
        {#each winnerSelectOptions as pos}
          <option value={pos}>{pos}</option>
        {/each}
      </select>
    {/key}
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
      {#key availableRunnerUpPositions.join(",")}
        <select
          class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
          value={group.runnerUp.position ?? ""}
          on:change={onRunnerUpPositionSelect}
          disabled={group.winner.position === null}
        >
          <option value="">Position</option>
          {#each runnerUpSelectOptions as pos}
            <option value={pos}>{pos}</option>
          {/each}
        </select>
      {/key}
    </div>
  {/if}
</div>

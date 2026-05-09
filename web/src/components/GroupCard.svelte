<script>
  let {
    group,
    groupIndex = 1,
    availableWinnerPositions = [],
    availableRunnerUpPositions = [],
    onUpdate,
  } = $props();

  let winnerSelectOptions = $derived(
    group.winner.position !== null && !availableWinnerPositions.includes(group.winner.position)
      ? [group.winner.position, ...availableWinnerPositions]
      : availableWinnerPositions
  );

  let runnerUpSelectOptions = $derived(
    group.runnerUp?.position != null && !availableRunnerUpPositions.includes(group.runnerUp.position)
      ? [group.runnerUp.position, ...availableRunnerUpPositions]
      : availableRunnerUpPositions
  );

  const EMPTY_RUNNER_UP = { na: "", name: "", position: null };

  function dispatchUpdate(field, value, extra = {}) {
    onUpdate?.({ groupIndex: groupIndex - 1, field, value, ...extra });
  }

  function dispatchWinnerUpdate(field, value) {
    const winner = { ...group.winner, [field]: value };
    dispatchUpdate("winner", winner);
  }

  function dispatchRunnerUpUpdate(field, value) {
    const runnerUp = { ...(group.runnerUp || EMPTY_RUNNER_UP), [field]: value };
    dispatchUpdate("runnerUp", runnerUp);
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
    const extra = hasRunnerUp ? { runnerUp: { na: "", name: "", position: null } } : {};
    dispatchUpdate("hasRunnerUp", hasRunnerUp, extra);
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
      oninput={(e) => dispatchWinnerUpdate("na", e.target.value.toUpperCase())}
    />
    <input
      type="text"
      placeholder="Name"
      class="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[100px] text-sm focus:outline-none focus:border-red-500"
      value={group.winner.name}
      oninput={(e) => dispatchWinnerUpdate("name", e.target.value)}
    />
    {#key availableWinnerPositions.join(",")}
      <select
        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
        value={group.winner.position ?? ""}
        onchange={onWinnerPositionSelect}
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
      onchange={toggleRunnerUp}
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
        oninput={(e) => dispatchRunnerUpUpdate("na", e.target.value.toUpperCase())}
      />
      <input
        type="text"
        placeholder="Name"
        class="border border-gray-300 rounded px-2 py-1 flex-1 min-w-[100px] text-sm focus:outline-none focus:border-red-500"
        value={group.runnerUp.name}
        oninput={(e) => dispatchRunnerUpUpdate("name", e.target.value)}
      />
      {#key availableRunnerUpPositions.join(",")}
        <select
          class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-500"
          value={group.runnerUp.position ?? ""}
          onchange={onRunnerUpPositionSelect}
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

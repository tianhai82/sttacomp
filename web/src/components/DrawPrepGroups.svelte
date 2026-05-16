<script>
  import Btn from "./Btn.svelte";
  import GroupCard from "./GroupCard.svelte";

  let {
    groups = [],
    availableWinnerPositions = [],
    availableRunnerUpPositionsPerGroup = [],
    onChange,
    onExport,
  } = $props();

  function handleUpdate(data) {
    const { groupIndex, field, value, ...extra } = data;
    const updated = [...groups];
    const patch = { [field]: value, ...extra };
    if (field === 'hasRunnerUp' && value === false) {
      patch.runnerUp = null;
    }
    updated[groupIndex] = { ...updated[groupIndex], ...patch };
    onChange?.(updated);
  }

  // Import button removed — import now happens from DrawList in list view
</script>

<div>
  {#each groups as group, i}
    <GroupCard
      {group}
      groupIndex={i + 1}
      {availableWinnerPositions}
      availableRunnerUpPositions={availableRunnerUpPositionsPerGroup[i] || []}
      onUpdate={handleUpdate}
    />
  {/each}

  <!-- Action buttons -->
  <div class="flex gap-3 mt-4 px-1">
    <Btn cls="bg-blue-500 text-white" onclick={() => onExport?.()}>Export</Btn>
  </div>
</div>

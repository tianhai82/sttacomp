<script>
  import Btn from "./Btn.svelte";
  import GroupCard from "./GroupCard.svelte";

  let {
    groups = [],
    availableWinnerPositions = [],
    availableRunnerUpPositionsPerGroup = [],
    onChange,
    onExport,
    onImport,
    onReset,
  } = $props();

  function handleUpdate(data) {
    const { groupIndex, field, value, extra } = data;
    const updated = [...groups];
    const patch = { [field]: value };
    if (field === 'hasRunnerUp' && value === false) {
      patch.runnerUp = null;
    }
    updated[groupIndex] = { ...updated[groupIndex], ...patch, ...extra };
    onChange?.(updated);
  }

  let fileInput;

  function triggerImport() {
    fileInput.click();
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    if (file) {
      onImport?.(file);
    }
    e.target.value = '';
  }
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

  <!-- Hidden file input for import -->
  <input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={onFileSelected} />

  <!-- Action buttons -->
  <div class="flex gap-3 mt-4 px-1">
    <Btn cls="bg-blue-500 text-white" onclick={() => onExport?.()}>Export</Btn>
    <Btn cls="bg-gray-500 text-white" onclick={triggerImport}>Import</Btn>
    <Btn cls="bg-red-700 text-white" onclick={() => onReset?.()}>Reset</Btn>
  </div>
</div>

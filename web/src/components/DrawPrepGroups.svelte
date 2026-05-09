<!-- web/src/components/DrawPrepGroups.svelte -->
<script>
  import { createEventDispatcher } from "svelte";
  import GroupCard from "./GroupCard.svelte";
  import Btn from "./Btn.svelte";
  const dispatch = createEventDispatcher();

  export let groups = [];
  export let availableWinnerPositions = [];
  export let availableRunnerUpPositionsPerGroup = [];

  function handleUpdate(e) {
    const { groupIndex, field, value, extra } = e.detail;
    const updated = [...groups];
    const patch = { [field]: value };
    // When hasRunnerUp is toggled off, also clear runnerUp data
    if (field === 'hasRunnerUp' && value === false) {
      patch.runnerUp = null;
    }
    updated[groupIndex] = { ...updated[groupIndex], ...patch, ...extra };
    groups = updated;
    dispatch("change", { groups: updated });
  }

  let fileInput;

  function triggerImport() {
    fileInput.click();
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    if (file) {
      dispatch("import", { file });
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
      on:update={handleUpdate}
    />
  {/each}

  <!-- Hidden file input for import -->
  <input bind:this={fileInput} type="file" accept=".json" class="hidden" on:change={onFileSelected} />

  <!-- Action buttons -->
  <div class="flex gap-3 mt-4 px-1">
    <Btn cls="bg-blue-500 text-white" on:click={() => dispatch("export")}>
      Export
    </Btn>
    <Btn cls="bg-gray-500 text-white" on:click={triggerImport}>
      Import
    </Btn>
    <Btn cls="bg-red-700 text-white" on:click={() => dispatch("reset")}>
      Reset
    </Btn>
  </div>
</div>

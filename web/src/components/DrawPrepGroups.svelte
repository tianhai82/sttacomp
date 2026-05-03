<!-- web/src/components/DrawPrepGroups.svelte -->
<script>
  import GroupCard from "./GroupCard.svelte";
  import { Button } from "svetamat";

  export let groups = [];
  export let availableWinnerPositions = [];
  export let availableRunnerUpPositionsPerGroup = [];

  function handleUpdate(e) {
    const { groupIndex, field, value } = e.detail;
    const updated = [...groups];
    updated[groupIndex] = { ...updated[groupIndex], [field]: value };
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
    <Button bgColor="bg-blue-500" textColor="text-white" on:click={() => dispatch("export")}>
      Export
    </Button>
    <Button bgColor="bg-gray-500" textColor="text-white" on:click={triggerImport}>
      Import
    </Button>
    <Button bgColor="bg-red-700" textColor="text-white">
      Reset
    </Button>
  </div>
</div>

<!-- web/src/components/DrawPrepGroups.svelte -->
<script>
  import GroupCard from "./GroupCard.svelte";
  import { Button } from "svetamat";

  export let groups = [];

  function handleUpdate(e) {
    const { groupIndex, field, value } = e.detail;
    const updated = [...groups];
    updated[groupIndex] = { ...updated[groupIndex], [field]: value };
    groups = updated;
    dispatch("change", { groups: updated });
  }
</script>

<div>
  {#each groups as group, i}
    <GroupCard {group} groupIndex={i + 1} on:update={handleUpdate} />
  {/each}

  <!-- Action buttons (non-functional until later tasks) -->
  <div class="flex gap-3 mt-4 px-1">
    <Button bgColor="bg-blue-500" textColor="text-white">
      Export
    </Button>
    <Button bgColor="bg-gray-500" textColor="text-white">
      Import
    </Button>
    <Button bgColor="bg-red-700" textColor="text-white">
      Reset
    </Button>
  </div>
</div>

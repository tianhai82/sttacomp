<script>
  import Btn from "./Btn.svelte";

  let {
    draws = [],
    onOpen,
    onNew,
    onDelete,
  } = $props();

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function handleDelete(id, eventName) {
    const label = eventName || "Untitled Draw";
    if (confirm(`Delete "${label}"? This cannot be undone.`)) {
      onDelete?.(id);
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-medium">My Draws</h2>
    <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>+ New Draw</Btn>
  </div>

  {#if draws.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p class="text-lg mb-4">No draws yet</p>
      <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>Create your first draw</Btn>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each draws as draw (draw.id)}
        <div
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
          onclick={() => onOpen?.(draw.id)}
          onkeydown={(e) => e.key === 'Enter' && onOpen?.(draw.id)}
          role="button"
          tabindex="0"
        >
          <h3 class="font-medium text-gray-900 mb-1 truncate pr-8">
            {draw.eventName || 'Untitled Draw'}
          </h3>
          <p class="text-sm text-gray-500">
            {draw.numGroups} group{draw.numGroups !== 1 ? 's' : ''} · {formatDate(draw.createdAt)}
          </p>
          <button
            class="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onclick|stopPropagation={() => handleDelete(draw.id, draw.eventName)}
            title="Delete draw"
          >
            🗑
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

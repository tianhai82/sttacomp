<script>
  import Btn from "./Btn.svelte";

  let {
    draws = [],
    onOpen,
    onNew,
    onDelete,
    onImport,
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

  let isDragOver = $state(false);
  let dragCounter = 0;
  let fileInput;

  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    isDragOver = true;
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) isDragOver = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragOver = false;
    dragCounter = 0;
    const file = e.dataTransfer?.files[0];
    if (file) {
      onImport?.(file);
    }
  }

  function triggerFileImport() {
    fileInput.click();
  }

  function onFileSelected(e) {
    const file = e.target.files[0];
    if (file) onImport?.(file);
    e.target.value = '';
  }
</script>

<div>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-medium">My Draws</h2>
    <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>+ New Draw</Btn>
  </div>

  {#if draws.length === 0}
    <div
      class="text-center py-12 px-6 rounded-lg border-2 border-dashed transition-colors {isDragOver
        ? 'border-blue-400 bg-blue-50 text-blue-600'
        : 'border-gray-300 text-gray-500'}"
      ondragenter={handleDragEnter}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
    >
      <p class="text-4xl mb-3">📄</p>
      <p class="text-lg mb-2">No draws yet</p>
      <p class="text-sm mb-4">Drag & drop a .json file here</p>
      <div class="flex items-center justify-center gap-3">
        <Btn cls="bg-gray-500 text-white" onclick={triggerFileImport}>Import Draw</Btn>
        <span class="text-gray-400 text-sm">or</span>
        <Btn cls="bg-red-500 text-white" onclick={() => onNew?.()}>+ New Draw</Btn>
      </div>
    </div>
    <!-- Hidden file input -->
    <input bind:this={fileInput} type="file" accept=".json" class="hidden" onchange={onFileSelected} />
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
            onclick={(e) => { e.stopPropagation(); handleDelete(draw.id, draw.eventName); }}
            title="Delete draw"
          >
            🗑
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

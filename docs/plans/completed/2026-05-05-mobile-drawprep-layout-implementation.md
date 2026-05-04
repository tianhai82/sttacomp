# Mobile-responsive DrawPrep layout — Implementation Plan

## Task 1: Remove footer from App.svelte

<!-- tdd: trivial -->
<!-- checkpoint: none -->

Remove the `<footer>` element from `web/src/App.svelte`.

In `web/src/App.svelte`, delete the entire footer block:

```svelte
<footer class="fixed w-full bottom-0 bg-red-100 border-t border-b border-red-300 elevation-5">
  <div class="h-4 flex items-center justify-center text-xs">
    Icons made by
    <a
      href="https://www.flaticon.com/authors/freepik"
      class="mx-1"
      title="Freepik">
      Freepik
    </a>
    from
    <a href="https://www.flaticon.com/" class="mx-1" title="Flaticon">
      www.flaticon.com
    </a>
  </div>
</footer>
```

Also remove the empty `<style></style>` block since it serves no purpose.

`git commit -m "remove footer to free bottom edge for mobile tab bar"`

---

## Task 2: Add mobile bottom tab bar and panel show/hide to DrawPrep

<!-- tdd: trivial -->
<!-- checkpoint: done -->

In `web/src/pages/DrawPrep.svelte`:

1. Add `mobileTab` state in the `<script>` block, after the `warnings` declaration:

```svelte
  let mobileTab = 'groups'; // 'groups' | 'chart'
```

2. Add bottom padding to the main container to prevent content hiding behind the tab bar. Change:

```svelte
<div class="container mx-auto pt-3 px-3 flex flex-col h-[calc(100vh-3rem)]">
```

to:

```svelte
<div class="container mx-auto pt-3 px-3 flex flex-col h-[calc(100vh-3rem)] pb-14 md:pb-0">
```

3. Make the groups panel conditional on mobile. Change:

```svelte
      <!-- Left panel: Groups form -->
      <div class="md:w-1/2 overflow-y-auto min-h-0">
```

to:

```svelte
      <!-- Left panel: Groups form -->
      <div class="md:w-1/2 overflow-y-auto min-h-0 {mobileTab === 'groups' ? '' : 'hidden md:block'}">
```

4. Make the chart panel conditional on mobile. Change:

```svelte
      <!-- Right panel: KO Chart -->
      <div class="md:w-1/2 overflow-y-auto min-h-0">
```

to:

```svelte
      <!-- Right panel: KO Chart -->
      <div class="md:w-1/2 overflow-y-auto min-h-0 {mobileTab === 'chart' ? '' : 'hidden md:block'}">
```

5. Add the bottom tab bar before the closing `</div>` of the main container, right after the `{/if}`:

```svelte
  {/if}

  <!-- Mobile bottom tab bar -->
  {#if confirmed && state}
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex md:hidden z-40">
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'groups'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        on:click={() => (mobileTab = 'groups')}>
        Groups
      </button>
      <button
        class="flex-1 py-3 text-sm font-medium text-center {mobileTab === 'chart'
          ? 'text-red-600 border-t-2 border-red-600'
          : 'text-gray-500'}"
        on:click={() => (mobileTab = 'chart')}>
        KO Chart
      </button>
    </div>
  {/if}
```

`git commit -m "add mobile bottom tab bar to DrawPrep page"`

---

## Task 3: Add chart sub-tabs to DrawPrepChart for mobile

<!-- tdd: trivial -->
<!-- checkpoint: done -->

In `web/src/components/DrawPrepChart.svelte`:

1. Add `activeColumn` state in the `<script>` block after the existing `columns` reactive declaration:

```svelte
  let activeColumn = 0;

  // Reset active column when columns change
  $: if (activeColumn >= columnCount) activeColumn = 0;
```

2. Replace the outer `<div>` template block. Change:

```svelte
<div class="flex gap-5 justify-center items-start flex-wrap">
  {#each columns as column}
    <div class="flex flex-col items-center w-64">
```

to:

```svelte
<!-- Mobile: sub-tab row -->
{#if columns.length > 1}
  <div class="flex md:hidden border-b border-gray-200 mb-3">
    {#each columns as column, i}
      <button
        class="flex-1 py-2 text-xs font-medium text-center {activeColumn === i
          ? 'text-red-600 border-b-2 border-red-600'
          : 'text-gray-500'}"
        on:click={() => (activeColumn = i)}>
        {column.label}
      </button>
    {/each}
  </div>
{/if}

<div class="flex gap-5 justify-center items-start flex-wrap">
  {#each columns as column, i}
    <div class="flex flex-col items-center w-64 {i !== activeColumn ? 'hidden md:flex' : ''}">
```

`git commit -m "add chart sub-tabs to show one half/quarter at a time on mobile"`

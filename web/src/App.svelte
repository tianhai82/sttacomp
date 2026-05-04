<script>
  import Logo from "./components/Logo.svelte";
  import Draw from "./pages/Draw.svelte";
  import DrawPrep from "./pages/DrawPrep.svelte";

  const pages = {
    draw: Draw,
    drawPrep: DrawPrep,
  };

  let selectedPage = "draw";
  $: component = pages[selectedPage];
</script>


<div
  class="h-12 elevation-4 bg-red-600 flex justify-between items-center pl-4 md:pl-6 pr-3">
  <h1 class="text-white font-bold text-lg flex items-center">
    <Logo />
    <span class="hidden sm:inline">Table Tennis Draw Helper</span>
    <span class="sm:hidden text-base">TT Draw</span>
  </h1>
  <div class="flex h-full">
    <button
      class="h-full text-white ripple focus:outline-none px-3 border-b-2 {selectedPage === 'draw'
        ? 'border-white bg-red-700'
        : 'border-transparent bg-red-600'}"
      on:click={() => (selectedPage = "draw")}>
      <span class="hidden sm:inline">Draw Positions</span>
      <span class="sm:hidden">Positions</span>
    </button>
    <button
      class="h-full text-white ripple focus:outline-none px-3 border-b-2 {selectedPage === 'drawPrep'
        ? 'border-white bg-red-700'
        : 'border-transparent bg-red-600'}"
      on:click={() => (selectedPage = "drawPrep")}>
      <span class="hidden sm:inline">Do Draw</span>
      <span class="sm:hidden">Draw</span>
    </button>
  </div>
</div>
<svelte:component this={component} />


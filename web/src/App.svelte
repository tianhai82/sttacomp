<script>
  import Tailwindcss from "./Tailwindcss.svelte";
  import Logo from "./components/Logo.svelte";
  import Draw from "./pages/Draw.svelte";

  let component = Draw;
</script>

<style>

</style>

<Tailwindcss />
<div
  class="h-12 elevation-4 bg-red-600 flex justify-between items-center pl-6 pr-3">
  <h1 class="text-white font-bold text-lg flex">
    <Logo />
    Table Tennis Draw Helper
  </h1>
  <!-- <button
    class="h-full text-white ripple focus:outline-none px-3"
    on:click={() => (component = Draw)}>
    Draw
  </button> -->
</div>
<svelte:component this={component} />

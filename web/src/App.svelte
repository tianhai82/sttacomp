<script>
  import Logo from "./components/Logo.svelte";
  import Draw from "./pages/Draw.svelte";
  import DrawPrep from "./pages/DrawPrep.svelte";
  import Router from "svelte-spa-router";
  import { link } from "svelte-spa-router";
  import active from "svelte-spa-router/active";

  const routes = {
    "/": Draw,
    "/draw-prep": DrawPrep,
    "/draw-prep/draw/:id": DrawPrep,
  };
</script>

<div
  class="h-12 shadow-lg bg-red-600 flex justify-between items-center pl-4 md:pl-6 pr-3">
  <h1 class="text-white font-bold text-lg flex items-center">
    <Logo />
    <span class="hidden sm:inline">Table Tennis Draw Helper</span>
    <span class="sm:hidden text-base">TT Draw</span>
  </h1>
  <div class="flex h-full">
    <a
      href="/"
      use:link
      use:active={{ path: "/", className: "border-white bg-red-700", inactiveClassName: "border-transparent bg-red-600" }}
      class="h-full text-white ripple focus:outline-none px-3 border-b-2 flex items-center">
      <span class="hidden sm:inline">Draw Positions</span>
      <span class="sm:hidden text-sm">Positions</span>
    </a>
    <a
      href="/draw-prep"
      use:link
      use:active={{ path: "/draw-prep", className: "border-white bg-red-700", inactiveClassName: "border-transparent bg-red-600" }}
      class="h-full text-white ripple focus:outline-none px-3 border-b-2 flex items-center">
      <span class="hidden sm:inline">Do Draw</span>
      <span class="sm:hidden text-sm">Draw</span>
    </a>
  </div>
</div>
<Router {routes} />

<script>
  import Btn from "../components/Btn.svelte";
  import { calculateDraws } from "../lib/calculateDraw";
  import SplitDraw from "../components/SplitDraw.svelte";

  let winners = $state(20);
  let runnerups = $state(20);
  let round = $state(0);
  let players = $state([]);
  let winnersPositions = $state([]);
  let sorted = $state(false);
  let sortedWinnersPosition = $derived.by(() => {
    const arr = [...winnersPositions];
    arr.sort(numberOrder);
    return arr;
  });
  let winnersPositionDisplay = $derived(sorted ? sortedWinnersPosition : winnersPositions);
  let runnerUpsPositions = $state([]);
  let byesPositions = $state([]);

  let winnersGrpsOf4 = $derived(groupInto4s(winnersPositionDisplay));
  let runnerUpsGrpsOf4 = $derived(groupInto4s(runnerUpsPositions));
  let byesGrpsOf4 = $derived(groupInto4s(byesPositions));

  function groupInto4s(array) {
    let grpsOf4 = [];
    for (let i = 0; i < array.length; i += 4) {
      grpsOf4.push(array.slice(i, i + 4));
    }
    return grpsOf4;
  }
  function numberOrder(a, b) {
    return a - b;
  }
  function winnerSeedLabel(n) {
    if (n <= 2) return String(n);
    return "=" + (Math.pow(2, Math.floor(Math.log2(n - 1))) + 1);
  }
  let calculatePromise = $state();
  function calculate() {
    players = [];
    winnersPositions = [];
    runnerUpsPositions = [];
    byesPositions = [];
    round = 0;
    calculatePromise = calculateDraws({ winners, runnerups }).then((data) => {
      round = data.rounds;
      for (let i = 0; i < round; i++) {
        players.push(`${i + 1}`);
      }
      data.byes.forEach((pos) => {
        players[pos - 1] = `${pos}: BYE`;
        byesPositions.push(pos);
      });
      data.winners.forEach((pos, i) => {
        players[pos - 1] = `${pos}: Winner: ${winnerSeedLabel(i + 1)}`;
        winnersPositions.push(pos);
      });
      data.runnerups.forEach((pos) => {
        players[pos - 1] = `${pos}: Runner-up`;
        runnerUpsPositions.push(pos);
      });
      players = players;
      winnersPositions = winnersPositions;
      runnerUpsPositions.sort(numberOrder);
      runnerUpsPositions = runnerUpsPositions;
      byesPositions.sort(numberOrder);
      byesPositions = byesPositions;
    });
  }
</script>

<div class="container mx-auto pt-3 px-3 flex flex-col">
  <div class="flex justify-around items-center">
    <div class="w-1/2 mx-2">
      <div>
        <label class="block text-gray-700 text-sm mb-1" for="winners">Total no. of winners</label>
        <input
          id="winners"
          type="number"
          class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
          bind:value={winners}
          onkeyup={calculate}
        />
      </div>
    </div>
    <div class="w-1/2 mx-2">
      <div>
        <label class="block text-gray-700 text-sm mb-1" for="runnerups">Total no. of runner-ups</label>
        <input
          id="runnerups"
          type="number"
          class="border border-gray-300 rounded px-3 py-1 w-full focus:outline-none focus:border-red-500"
          bind:value={runnerups}
          onkeyup={calculate}
        />
      </div>
    </div>
  </div>
  <div class="flex justify-end mr-2 mt-2">
    <Btn cls="bg-red-500 text-white" onclick={calculate}>Calculate</Btn>
  </div>
  {#await calculatePromise}
    <div
      class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-blue-100 flex items-center"
    >
      <div class="h-8 w-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
      <div class="ml-4">Calculation in progress...</div>
    </div>
  {:then}
    {#if players.length > 0}
      <div class="rounded-lg mt-4 mx-2 py-4 px-4 shadow-md bg-green-100">
        <h2
          class="sm:text-lg text-base font-medium mr-2 flex items-center
          justify-between"
        >
          Winners' Positions
          <div class="ml-6">
            <label class="flex items-center cursor-pointer text-orange-600">
              <input type="checkbox" class="mr-1.5" bind:checked={sorted} />
              <span>Ascending</span>
            </label>
          </div>
        </h2>
        <div class="flex flex-wrap">
          {#each winnersGrpsOf4 as grp, i}
            <div class="mr-12 flex">
              {#each grp as pos}
                <div class="w-12 text-right tracking-tight">{pos}</div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
      {#if runnerUpsGrpsOf4.length > 0}
        <div class="rounded-lg mt-2 mx-2 py-4 px-4 shadow-md bg-orange-100">
          <h2 class="sm:text-lg text-base font-medium mb-2">
            Runner-Ups' Positions
          </h2>
          <div class="flex flex-wrap">
            {#each runnerUpsGrpsOf4 as grp, i}
              <div class="mr-12 flex">
                {#each grp as pos}
                  <div class="w-12 text-right tracking-tight">{pos}</div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {/if}
      <div class="rounded-lg mt-2 mx-2 py-4 px-4 shadow-md bg-gray-200">
        <h2 class="sm:text-lg text-base font-medium mb-2">Byes' Positions</h2>
        <div class="flex flex-wrap">
          {#each byesGrpsOf4 as grp, i}
            <div class="mr-12 flex">
              {#each grp as pos}
                <div class="w-12 text-right tracking-tight">{pos}</div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
      <div class="rounded-lg my-4 mx-2 py-4 px-4 overflow-x-auto bg-white">
        <SplitDraw {round} {players} />
      </div>
    {/if}
  {:catch e}
    <div
      class="rounded-lg mt-4 mx-2 p-4 shadow-md bg-red-100 flex items-center"
    >
      <span class="material-icons text-red-500">error</span>
      <div class="ml-4">{e.message}</div>
    </div>
  {/await}
</div>

<script>
  import { Input, Button, Checkbox } from "svetamat";
  import { calculateDraws } from "../apis/draw";
  import Knockout from "../components/Knockout.svelte";

  let winners = 20;
  let runnerups = 20;
  let round = 0;
  let players = [];
  let winnersPositions = [];
  let sorted = false;
  let sortedWinnersPosition = [];
  let winnersPositionDisplay = [];
  let runnerUpsPositions = [];
  let byesPositions = [];
  $: {
    sortedWinnersPosition = [...winnersPositions];
    sortedWinnersPosition.sort(numberOrder);
  }
  $: if (sorted) {
    winnersPositionDisplay = sortedWinnersPosition;
  } else {
    winnersPositionDisplay = winnersPositions;
  }
  let winnersGrpsOf4;
  let runnerUpsGrpsOf4;
  let byesGrpsOf4;
  $: winnersGrpsOf4 = groupInto4s(winnersPositionDisplay);
  $: runnerUpsGrpsOf4 = groupInto4s(runnerUpsPositions);
  $: byesGrpsOf4 = groupInto4s(byesPositions);

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
  function calculate() {
    calculateDraws({ winners, runnerups })
      .then(data => {
        round = data.rounds;
        players = [];
        winnersPositions = [];
        runnerUpsPositions = [];
        byesPositions = [];
        for (let i = 0; i < round; i++) {
          players.push(`${i + 1}`);
        }
        data.byes.forEach((pos, i) => {
          players[pos - 1] = `${pos}: BYE ${i + 1}`;
          byesPositions.push(pos);
        });
        data.winners.forEach((pos, i) => {
          players[pos - 1] = `${pos}: Winner: ${i + 1}`;
          winnersPositions.push(pos);
        });
        data.runnerups.forEach((pos, i) => {
          players[pos - 1] = `${pos}: Runner-up: ${i + 1}`;
          runnerUpsPositions.push(pos);
        });
        players = players;
        winnersPositions = winnersPositions;
        runnerUpsPositions.sort(numberOrder);
        runnerUpsPositions = runnerUpsPositions;
        byesPositions.sort(numberOrder);
        byesPositions = byesPositions;
      })
      .catch(err => console.log(err));
  }
</script>

<div class="container mx-auto pt-3 px-3 flex flex-col">
  <div class="flex justify-around items-center">
    <div class="w-1/2 mx-2">
      <Input
        number
        outlined
        on:keyup={calculate}
        label="Total no. of winners"
        bind:value={winners} />
    </div>
    <div class="w-1/2 mx-2">
      <Input
        number
        outlined
        on:keyup={calculate}
        label="Total no. of runner-ups"
        bind:value={runnerups} />
    </div>
  </div>
  <div class="flex flex-row-reverse mr-2 -mt-3">
    <Button bgColor="bg-red-500" textColor="text-white" on:click={calculate}>
      Calculate
    </Button>
  </div>
  {#if players.length > 0}
    <div class="rounded-lg mt-4 mx-2 py-4 px-4 elevation-3 bg-green-100">
      <h2
        class="sm:text-lg text-base font-medium mr-2 flex items-center
        justify-between">
        Winners' Positions
        <div class="ml-6">
          <Checkbox
            label="Ascending"
            color="text-orange-600"
            bind:checked={sorted} />
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
    <div class="rounded-lg mt-2 mx-2 py-4 px-4 elevation-3 bg-orange-100">
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
    <div class="rounded-lg mt-2 mx-2 py-4 px-4 elevation-3 bg-gray-200">
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
    <div class="rounded-lg my-4 mx-2 py-4 px-4 elevation-3 overflow-x-auto">
      <Knockout {round} {players} />
    </div>
  {/if}
</div>

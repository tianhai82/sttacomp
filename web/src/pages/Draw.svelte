<script>
  import { Input, Button } from "svetamat";
  import { calculateDraws } from "../apis/draw";
  import Knockout from "../components/Knockout.svelte";

  let winners = 20;
  let runnerups = 20;
  let round = 0;
  let players = [];
  let winnersPositions = [];
  let runnerUpsPositions = [];
  let byesPositions = [];
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
        winnersPositions.sort(numberOrder);
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
    <div class="rounded-lg mt-4 mx-2 py-4 px-4 elevation-3">
      <h2 class="text-lg font-medium mb-2">Winners' Positions</h2>
      <div class="flex flex-wrap">
        {#each winnersPositions as pos}
          <div class="mr-5">{pos}</div>
        {/each}
      </div>
    </div>
    <div class="rounded-lg mt-2 mx-2 py-4 px-4 elevation-3">
      <h2 class="text-lg font-medium mb-2">Runner-Ups' Positions</h2>
      <div class="flex flex-wrap">
        {#each runnerUpsPositions as pos}
          <div class="mr-5">{pos}</div>
        {/each}
      </div>
    </div>
    <div class="rounded-lg mt-2 mx-2 py-4 px-4 elevation-3">
      <h2 class="text-lg font-medium mb-2">Byes' Positions</h2>
      <div class="flex flex-wrap">
        {#each byesPositions as pos}
          <div class="mr-5">{pos}</div>
        {/each}
      </div>
    </div>
    <div class="rounded-lg my-4 mx-2 py-4 px-4 elevation-3 overflow-x-auto">
      <Knockout {round} {players} />
    </div>
  {/if}
</div>

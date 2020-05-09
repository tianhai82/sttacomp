<script>
  export let level = 1;
  export let player1 = "";
  export let player2 = "";
  export let time = "";
  export let table = "";
  let results = "";
  $: h = 2 ** (level - 1) * 100;
  $: padding = (2 ** (level - 1) * 34 - 26) / 2 + 6 * (2 ** (level - 1) - 1);
  $: label = results || `${time} ${table}`;
  let containsBye;
  $: containsBye = p => p.toLowerCase().includes("bye");
  $: containsWinner = p => p.toLowerCase().includes("winner");
  $: containsRunnerUp = p => p.toLowerCase().includes("runner-up");
</script>

<style lang="postcss">
  .border-right {
    border-right: 1px solid rgba(0, 0, 0, 0.4);
    border-top: 1px solid rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(0, 0, 0, 0.4);
    border-radius: 0 5px 5px 0;
  }
</style>

<div style="height:{h + 'px'}" class="w-40 flex items-center">
  <div class="w-full">
    <div
      class="pl-3 overflow-auto h-6 font-semibold"
      class:text-green-700={containsWinner(player1)}
      class:text-orange-700={containsRunnerUp(player1)}
      class:text-gray-400={containsBye(player1)}>
      {player1}
    </div>
    <div class="border-right" style="padding:{padding + 'px 0'}">
      <div
        class="pl-3 h-6 overflow-auto">
        {label}
      </div>
    </div>
    <div
      class="pl-3 overflow-auto h-6 font-semibold"
      class:text-green-700={containsWinner(player2)}
      class:text-orange-700={containsRunnerUp(player2)}
      class:text-gray-400={containsBye(player2)}>
      {player2}
    </div>
  </div>
</div>

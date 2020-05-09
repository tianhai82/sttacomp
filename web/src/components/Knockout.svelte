<script>
  import { onMount } from "svelte";
  import Match from "./Match.svelte";

  export let round = 1;
  export let players = [];

  let levelMatches = [];
  function check(round, players) {
    const h = round & (round - 1);
    if (h !== 0) {
      throw new Error(
        "Round must be a number in the sequence 2,4,8,16,32,64 ..."
      );
    }
    if (players.length !== round) {
      if (players.length === 0) {
        for (let i = 0; i < round; i += 1) {
          players.push("-");
        }
      } else {
        throw new Error("players count does not match round");
      }
    }
    const level1Matches = [];
    for (let i = 0; i < players.length; i += 2) {
      const p1 = players[i];
      const p2 = players[i + 1];
      level1Matches.push({ p1, p2 });
    }
    levelMatches.push(level1Matches);
    let r = round / 2;
    while (r >= 2) {
      const matches = [];
      for (let i = 0; i < r; i += 2) {
        matches.push({ p1: "", p2: "" });
      }
      levelMatches.push(matches);
      r /= 2;
    }
  }

  $: levels = Math.sqrt(round);
  $: {
    levelMatches = [];
    check(round, players);
  }
  let matchColor;
  $: matchColor = (level, match) => {
    if (level > levelMatches.length - 3) return "";
    if (match < levelMatches[level].length / 4) {
      return "bg-orange-200";
    }
    if (match < levelMatches[level].length / 2) {
      return "bg-green-100";
    }
    if (
      match >= levelMatches[level].length / 2 &&
      match < (levelMatches[level].length / 4) * 3
    ) {
      return "bg-orange-200";
    }
    return "bg-green-100";
  };
</script>

<style lang="postcss">
  .border-right {
    border-right: 1px solid rgba(0, 0, 0, 0.4);
    border-top: 1px solid rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid rgba(0, 0, 0, 0.4);
    border-radius: 0 5px 5px 0;
  }
</style>

<div class="flex flex-row">
  {#each levelMatches as matches, i}
    <div class="flex flex-col flex-no-wrap">
      {#each matches as match, m}
        <div class={matchColor(i, m)}>
          <Match player1={match.p1} player2={match.p2} level={i + 1} table="" />
        </div>
      {/each}
    </div>
  {/each}
</div>

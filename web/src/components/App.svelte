<script>
  import Navbar from "./components/Navbar.svelte";
  import Knockout from "./components/Knockout.svelte";
  import Schedule from "./components/Schedule.svelte";

  let round = 32;
  let players = [];
  function getRandomInt(min, max) {
    const min1 = Math.ceil(min);
    const max1 = Math.floor(max);
    return Math.floor(Math.random() * (max1 - min1)) + min1;
  }
  function fillPlayers() {
    let tempPlayers = [
      "XU Xin",
      "FAN Zhendong",
      "MA Long",
      "LIN Gaoyuan",
      "BYE",
      "CALDERANO Hugo",
      "FALCK Mattias",
      "BOLL Timo",
      "LIANG Jingkun",
      "NIWA Koki",
      "OVTCHAROV Dimitrij",
      "PITCHFORD Liam",
      "LIN Yun-Ju",
      "MIZUTANI Jun",
      "FRANZISKA Patrick",
      "JANG Woojin",
      "XU Xin",
      "FAN Zhendong",
      "MA Long",
      "LIN Gaoyuan",
      "BYE",
      "CALDERANO Hugo",
      "FALCK Mattias",
      "BOLL Timo",
      "LIANG Jingkun",
      "NIWA Koki",
      "OVTCHAROV Dimitrij",
      "PITCHFORD Liam",
      "LIN Yun-Ju",
      "MIZUTANI Jun",
      "FRANZISKA Patrick",
      "JANG Woojin"
    ];
    const temp = [];
    while (tempPlayers.length > 0) {
      const index = getRandomInt(0, tempPlayers.length);
      temp.push(tempPlayers[index]);
      tempPlayers = tempPlayers.filter((p, i) => i !== index);
    }
    players = temp;
  }
</script>

<style lang="text/postcss">

</style>

<main class="bg-gray-200 h-screen overflow-y-auto">
  <Navbar />
  <div class="container">
    <Knockout {round} {players} />
    <div class="h-12" />
    <button
      on:click={fillPlayers}
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4
      rounded">
      Fill
    </button>
  </div>
</main>

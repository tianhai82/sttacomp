<script>
  export let round = 1;
  export let players = [];

  $: columnCount = round <= 64 ? 2 : 4;
  $: positionsPerColumn = round / columnCount;

  function extractLabel(playerStr, pos) {
    if (!playerStr || playerStr === `${pos}`) return `${pos}`;
    return playerStr.replace(`${pos}: `, '');
  }

  function getColumns(round, players, columnCount, positionsPerColumn) {
    const columns = [];
    for (let c = 0; c < columnCount; c++) {
      const startPos = c * positionsPerColumn + 1;
      const quarters = [];
      const quarterCount = positionsPerColumn / 16;
      for (let q = 0; q < quarterCount; q++) {
        const quarterStart = startPos + q * 16;
        const eighths = [];
        for (let e = 0; e < 2; e++) {
          const eighthStart = quarterStart + e * 8;
          const groups = [];
          for (let g = 0; g < 2; g++) {
            const groupStart = eighthStart + g * 4;
            const groupPlayers = [];
            for (let p = 0; p < 4; p++) {
              const pos = groupStart + p;
              const raw = players[pos - 1] || `${pos}`;
              groupPlayers.push({
                pos,
                label: extractLabel(raw, pos),
                isBye: raw.toUpperCase().includes('BYE'),
                isWinner: raw.toLowerCase().includes('winner'),
                isRunnerUp: raw.toLowerCase().includes('runner-up'),
              });
            }
            groups.push(groupPlayers);
          }
          eighths.push(groups);
        }
        quarters.push(eighths);
      }
      columns.push({
        label: columnCount === 2 ? (c === 0 ? 'TOP HALF' : 'BOTTOM HALF') : `QUARTER ${c + 1}`,
        quarters,
      });
    }
    return columns;
  }

  $: columns = getColumns(round, players, columnCount, positionsPerColumn);
</script>

<div class="flex gap-5 justify-center items-start flex-wrap">
  {#each columns as column}
    <div class="flex flex-col items-center w-64">
      <div class="text-gray-700 font-bold text-sm tracking-wide uppercase mb-2">{column.label}</div>
      <div class="flex flex-col gap-1 w-full">
        {#each column.quarters as quarter}
          <div class="flex flex-col gap-1 border border-gray-300 rounded-lg p-2">
            {#each quarter as eighth}
              <div class="flex flex-col gap-1 bg-gray-50 rounded p-1">
                {#each eighth as group}
                  <div class="flex flex-col bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                    {#each group as player, i}
                      <div class="flex items-center h-5 text-xs text-gray-800 {i > 0 ? 'border-t border-gray-100' : ''}">
                        <span class="bg-gray-100 font-bold min-w-[22px] h-full flex items-center justify-center border-r border-gray-200 text-gray-700">{player.pos}</span>
                        <span class="flex-1 font-semibold pl-2 truncate {player.isBye ? 'text-gray-400 italic font-normal' : player.isWinner ? 'text-green-700' : player.isRunnerUp ? 'text-orange-700' : ''}">
                          {player.label}
                        </span>
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

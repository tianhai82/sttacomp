<script>
  export let round = 1;
  export let players = [];

  $: columnCount = round <= 64 ? 2 : 4;
  $: positionsPerColumn = round / columnCount;

  function extractLabel(raw, pos) {
    if (!raw || raw == pos) return String(pos);
    return raw.replace(`${pos}: `, '');
  }

  function playerType(raw) {
    const upper = raw.toUpperCase();
    if (upper.includes('BYE')) return 'bye';
    if (upper.includes('WINNER')) return 'winner';
    if (upper.includes('RUNNER-UP')) return 'runner-up';
    return '';
  }

  function isMiddleGroup(eighthIndex, groupIndex) {
    const groupInQuarter = eighthIndex * 2 + groupIndex;
    return groupInQuarter === 1 || groupInQuarter === 2;
  }

  function buildPlayer(pos, players) {
    const raw = players[pos - 1] || String(pos);
    return { pos, label: extractLabel(raw, pos), type: playerType(raw) };
  }

  function buildGroup(startPos, players) {
    return [0, 1, 2, 3].map(p => buildPlayer(startPos + p, players));
  }

  function buildEighth(startPos, players) {
    return [0, 4].map(offset => buildGroup(startPos + offset, players));
  }

  function buildQuarter(startPos, players) {
    return [0, 8].map(offset => buildEighth(startPos + offset, players));
  }

  function buildColumn(columnIndex, positionsPerColumn, columnCount, players) {
    const startPos = columnIndex * positionsPerColumn + 1;
    const quarterCount = positionsPerColumn / 16;
    const quarters = Array.from({ length: quarterCount }, (_, q) =>
      buildQuarter(startPos + q * 16, players)
    );
    const label = columnCount === 2
      ? (columnIndex === 0 ? 'TOP HALF' : 'BOTTOM HALF')
      : `QUARTER ${columnIndex + 1}`;
    return { label, quarters };
  }

  $: columns = Array.from({ length: columnCount }, (_, c) =>
    buildColumn(c, positionsPerColumn, columnCount, players)
  );
</script>

<div class="flex gap-5 justify-center items-start flex-wrap">
  {#each columns as column}
    <div class="flex flex-col items-center w-64">
      <div class="text-gray-700 font-bold text-sm tracking-wide uppercase mb-2">{column.label}</div>
      <div class="flex flex-col gap-1 w-full">
        {#each column.quarters as quarter}
          <div class="flex flex-col gap-1 border border-gray-300 rounded-lg p-2">
            {#each quarter as eighth, ei}
              <div class="flex flex-col gap-1 rounded p-1">
                {#each eighth as group, gi}
                  <div class="flex flex-col border border-gray-200 rounded shadow-sm overflow-hidden {isMiddleGroup(ei, gi) ? 'bg-gray-100' : 'bg-white'}">
                    {#each group as player, i}
                      <div class="flex items-center h-6 text-sm text-gray-800 {i > 0 ? 'border-t border-gray-100' : ''}">
                        <span class="bg-gray-100 font-bold min-w-[24px] h-full flex items-center justify-center border-r border-gray-200 text-gray-700 text-sm">{player.pos}</span>
                        <span class="flex-1 font-semibold pl-2 truncate {player.type === 'bye' ? 'text-gray-400 italic font-normal' : ''} {player.type === 'winner' ? 'text-green-700' : ''} {player.type === 'runner-up' ? 'text-orange-500' : ''}">
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

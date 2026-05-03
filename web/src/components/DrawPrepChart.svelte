<!-- web/src/components/DrawPrepChart.svelte -->
<script>
  export let round = 1;
  export let winners = [];
  export let runnerups = [];
  export let byes = [];
  export let placedPlayers = new Map(); // position -> {name, na, type}

  $: columnCount = round <= 64 ? 2 : 4;
  $: positionsPerColumn = round / columnCount;

  // Build the full players array for SplitDraw-like rendering
  $: allPositions = Array.from({ length: round }, (_, i) => i + 1);

  $: players = allPositions.map(pos => {
    const placed = placedPlayers.get(pos);
    if (placed) {
      return `${pos}: ${placed.label || placed.name}`;
    }
    if (byes.includes(pos)) {
      return `${pos}: BYE`;
    }
    if (winners.includes(pos)) {
      return `${pos}: Winner`;
    }
    if (runnerups.includes(pos)) {
      return `${pos}: Runner-up`;
    }
    return String(pos);
  });

  function extractLabel(raw, pos) {
    if (!raw || raw == pos) return String(pos);
    return raw.replace(`${pos}: `, '');
  }

  function playerType(raw, pos) {
    const placed = placedPlayers.get(pos);
    if (placed) return { kind: placed.type === 'winner' ? 'winner' : 'runner-up', named: !!placed.na || !!placed.name };
    const upper = raw.toUpperCase();
    if (upper.includes('BYE')) return { kind: 'bye', named: false };
    if (upper.includes('WINNER')) return { kind: 'winner', named: false };
    if (upper.includes('RUNNER-UP')) return { kind: 'runner-up', named: false };
    return { kind: '', named: false };
  }

  function isMiddleGroup(eighthIndex, groupIndex) {
    const groupInQuarter = eighthIndex * 2 + groupIndex;
    return groupInQuarter === 1 || groupInQuarter === 2;
  }

  function buildPlayer(pos, players) {
    const raw = players[pos - 1] || String(pos);
    const typeInfo = playerType(raw, pos);
    return { pos, label: extractLabel(raw, pos), kind: typeInfo.kind, named: typeInfo.named };
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
    const label = columnCount === 2
      ? (columnIndex === 0 ? 'TOP HALF' : 'BOTTOM HALF')
      : `QUARTER ${columnIndex + 1}`;

    if (positionsPerColumn >= 16) {
      const quarterCount = positionsPerColumn / 16;
      const quarters = Array.from({ length: quarterCount }, (_, q) =>
        buildQuarter(startPos + q * 16, players)
      );
      return { label, quarters };
    }

    const groupCount = Math.ceil(positionsPerColumn / 4);
    const groups = Array.from({ length: groupCount }, (_, g) => {
      const size = Math.min(4, positionsPerColumn - g * 4);
      return Array.from({ length: size }, (_, p) => buildPlayer(startPos + g * 4 + p, players));
    });
    return { label, quarters: [[groups]] };
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
                        <span class="flex-1 pl-2 truncate
                          {player.named ? 'font-bold' : 'font-normal'}
                          {!player.named && player.kind === 'winner' ? 'italic text-green-700 opacity-50' : ''}
                          {!player.named && player.kind === 'runner-up' ? 'italic text-orange-500 opacity-50' : ''}
                          {player.named && player.kind === 'winner' ? 'text-green-700' : ''}
                          {player.named && player.kind === 'runner-up' ? 'text-orange-500' : ''}
                          {player.kind === 'bye' ? 'italic text-gray-400 opacity-50 font-normal' : ''}
                          {!player.kind ? 'text-gray-600 opacity-40' : ''}
                        ">
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

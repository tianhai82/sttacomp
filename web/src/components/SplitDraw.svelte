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

<style>
  .columns-container {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .column {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 260px;
  }
  .column-label {
    font-size: 14px;
    font-weight: bold;
    color: #eee;
    margin-bottom: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .column-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
  .quarter {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px;
  }
  .eighth {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 2px;
  }
  .group {
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #ffffff 0%, #e2e8f0 100%);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
    border: 1px solid #94a3b8;
  }
  .player {
    display: flex;
    align-items: center;
    height: 19px;
    font-size: 11px;
    color: #0f172a;
  }
  .player + .player {
    border-top: 1px solid #cbd5e1;
  }
  .pos {
    background: linear-gradient(to bottom, #fde047, #eab308);
    font-weight: 700;
    min-width: 22px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid #94a3b8;
    color: #000;
    font-size: 11px;
  }
  .name {
    flex: 1;
    font-weight: 700;
    padding-left: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .name.winner { color: #15803d; }
  .name.runner-up { color: #c2410c; }
  .name.bye { color: #64748b; font-style: italic; font-weight: 500; }
</style>

<div class="columns-container">
  {#each columns as column}
    <div class="column">
      <div class="column-label">{column.label}</div>
      <div class="column-body">
        {#each column.quarters as quarter}
          <div class="quarter">
            {#each quarter as eighth}
              <div class="eighth">
                {#each eighth as group}
                  <div class="group">
                    {#each group as player}
                      <div class="player">
                        <span class="pos">{player.pos}</span>
                        <span class="name {player.isBye ? 'bye' : player.isWinner ? 'winner' : player.isRunnerUp ? 'runner-up' : ''}">
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

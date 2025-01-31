<script lang="ts">
  import { type TerrainSymbol, Terrain } from '$lib/map';
  import { Dice, Roll } from '$lib/dice';
  export let terrain: Terrain;
  export let dice: Dice;
  
  let roll: Roll | null = null;
  let landingPositions: [number, number][] = [];
  
  // Subscribe to dice store changes, but only new rolls
  $: if ($dice.lastRoll !== null && roll?.timestamp !== $dice.lastRoll?.timestamp) {
    landingPositions = terrain.getLandingPositions($dice.lastRoll.result);
    roll = $dice.lastRoll;
  } else {
    landingPositions = [];
  }
  

  // Map terrain types to colors
  const terrainColors: Record<TerrainSymbol, string> = {
    g: 'grass',
    w: 'water',
    s: 'sand',
    f: 'fairway',
    t: 'tree',
    u: 'up_arrow',
    d: 'down_arrow',
    l: 'left_arrow',
    r: 'right_arrow',
  };

  const backgroundColor = '#272727';


  // Function to determine corner rounding for each corner
  function getCornerRadii(row: number, col: number, currentTile: TerrainSymbol) {
    const corners = { tl: 0, tr: 0, bl: 0, br: 0 };
    const radius = 2;

    // Check all adjacent tiles (including diagonals)
    const hasTop = row > 0 && terrain.map[row-1][col] === currentTile;
    const hasBottom = row < terrain.height-1 && terrain.map[row+1][col] === currentTile;
    const hasLeft = col > 0 && terrain.map[row][col-1] === currentTile;
    const hasRight = col < terrain.width-1 && terrain.map[row][col+1] === currentTile;
    
    // Top-left corner
    if (!hasTop && !hasLeft) corners.tl = radius;
    // Top-right corner
    if (!hasTop && !hasRight) corners.tr = radius;
    // Bottom-left corner
    if (!hasBottom && !hasLeft) corners.bl = radius;
    // Bottom-right corner
    if (!hasBottom && !hasRight) corners.br = radius;

    return corners;
  }

  // Function to check if a position matches the current tile
  function isPositionAtTile(row: number, col: number, position: [number, number] | null): boolean {
    return position !== null && position[1] === row && position[0] === col;
  }

  function isLandingPosition(row: number, col: number): boolean {
    return landingPositions.some(([x, y]) => x === col && y === row);
  }

  // Make ball position reactive
  $: ballPosition = terrain.ballPosition;
  
  function handleTileClick(row: number, col: number) {
    if (isLandingPosition(row, col) && $dice.lastRoll !== null) {
      terrain.moveBall($dice.lastRoll.result, [col, row]);
      // Check if new position is on sand, update dice accordingly
      if (terrain.map[row][col] === 's') {
        dice.setMaxRoll(2);
      } else if (terrain.map[row][col] === 'f') {
        dice.setMaxRoll(8); 
      } else {
        dice.setMaxRoll(6);
      }
      landingPositions = [];
      ballPosition = terrain.ballPosition;
    }
  }
</script>

<div class="map">
  {#each terrain.map as row, rowIndex}
    <div class="row">
      {#each row as tile, colIndex}
        {@const corners = getCornerRadii(rowIndex, colIndex, tile)}
        {@const isBall = isPositionAtTile(rowIndex, colIndex, ballPosition)}
        {@const isHole = isPositionAtTile(rowIndex, colIndex, terrain.holePosition)}
        {@const isStart = isPositionAtTile(rowIndex, colIndex, terrain.startPosition)}
        {@const isLanding = isLandingPosition(rowIndex, colIndex)}
        <svg 
          viewBox="0 0 10 10" 
          class={`tile ${isHole ? 'hole' : isStart ? 'start' : terrainColors[tile]} ${isLanding ? 'landing' : ''}`}
          role="button"
          aria-label={`${isBall ? 'ball' : isHole ? 'hole' : isStart ? 'start' : terrainColors[tile]} terrain`}
          on:click={() => handleTileClick(rowIndex, colIndex)}
          on:keydown={(e) => e.key === 'Enter' && handleTileClick(rowIndex, colIndex)}
          tabindex="0"
          focusable="true"
        >
          <rect 
            x="0" 
            y="0" 
            width="10" 
            height="10" 
            fill={backgroundColor}
          />
          <path 
            d={`
              M ${0.5 + corners.tl} 0.5
              H ${9.5 - corners.tr}
              A ${corners.tr} ${corners.tr} 0 0 1 9.5 ${0.5 + corners.tr}
              V ${9.5 - corners.br}
              A ${corners.br} ${corners.br} 0 0 1 ${9.5 - corners.br} 9.5
              H ${0.5 + corners.bl}
              A ${corners.bl} ${corners.bl} 0 0 1 0.5 ${9.5 - corners.bl}
              V ${0.5 + corners.tl}
              A ${corners.tl} ${corners.tl} 0 0 1 ${0.5 + corners.tl} 0.5
            `}
          />
          {#if isBall}
            <circle 
              cx="5" 
              cy="5" 
              r="2.5" 
              class="ball"
              stroke="#666"
              stroke-width="0.5"
            />
          {/if}
        </svg>
      {/each}
    </div>
  {/each}
</div>

<style>
  .map {
    display: flex;
    flex-direction: column;
    border: 2px solid #333;
    background-color: backgroundColor;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
  
  .row {
    display: flex;
  }

  .tile {
    width: 32px;
    height: 32px;
    transition: transform 0.1s ease;
  }

  .tile.grass {
    fill: #161;
  }

  .tile.water {
    fill: #33f;
  }

  .tile.sand {
    fill: #fa3;
  }

  .tile.fairway {
    fill: #3a3;
  }

  .tile.tree {
    fill: #666;
  }

  .tile.start {
    fill: rgb(170, 51, 138);
  }

  .tile.hole {
    fill: #111;
  }

  .ball {
    fill: #d6d6d6;
  }

  .tile:hover {
    transform: scale(1.3);
    cursor: pointer;
  }

  .tile:hover rect {
    fill: #f77;
  }

  .tile.landing rect{
    fill: #f77;
  }
</style> 
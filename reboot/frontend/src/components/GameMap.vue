<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TerrainSymbol } from '@/lib/terrain'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'

const props = defineProps<{
  allowSave?: boolean
}>()

const game = useGameStore()
const auth = useAuthStore()

const terrainColors: Record<TerrainSymbol, string> = {
  g: 'grass',
  w: 'water',
  s: 'sand',
  f: 'fairway',
  t: 'tree'
}

const backgroundColor = '#272727'

function getCornerRadii(row: number, col: number, tile: TerrainSymbol) {
  const corners = { tl: 0, tr: 0, bl: 0, br: 0 }
  const radius = 2
  const map = game.terrain.map
  const H = game.terrain.height
  const W = game.terrain.width

  const hasTop = row > 0 && map[row - 1][col] === tile
  const hasBottom = row < H - 1 && map[row + 1][col] === tile
  const hasLeft = col > 0 && map[row][col - 1] === tile
  const hasRight = col < W - 1 && map[row][col + 1] === tile

  if (!hasTop && !hasLeft) corners.tl = radius
  if (!hasTop && !hasRight) corners.tr = radius
  if (!hasBottom && !hasLeft) corners.bl = radius
  if (!hasBottom && !hasRight) corners.br = radius

  return corners
}

function isBall(row: number, col: number): boolean {
  return game.terrain.ballPosition[0] === col && game.terrain.ballPosition[1] === row
}

function isHole(row: number, col: number): boolean {
  return game.terrain.holePosition[0] === col && game.terrain.holePosition[1] === row
}

function isStart(row: number, col: number): boolean {
  return game.terrain.startPosition[0] === col && game.terrain.startPosition[1] === row
}

function handleTileClick(row: number, col: number) {
  if (game.isLanding(col, row)) {
    game.moveTo(col, row)
  }
}

const viewBox = computed(() =>
  `0 0 ${game.terrain.width * 10} ${game.terrain.height * 10}`
)

const saved = ref(false)

// Reset saved state when a new hole is loaded
watch(() => game.terrain.seed, () => {
  saved.value = false
})

async function saveHolePlay() {
  if (!auth.user) return
  const t = game.terrain

  // If the hole hasn't been persisted yet (id == -1), save it first
  let holeId = t.id
  if (holeId < 0) {
    try {
      const hole = await api.post<{ id: number }>('/holes', {
        name: 'Hole ' + t.seed,
        seed: t.seed,
        width: t.width,
        height: t.height
      })
      holeId = hole.id
      t.id = holeId
    } catch (e: any) {
      // Hole with same seed+dimensions may already exist — try to find it
      try {
        const existing = await api.get<{ holes: { id: number }[] }>(
          `/holes?page=0&limit=1`
        )
        // Fallback: we can't easily look up by seed via current API,
        // so just log the error
        console.error('Failed to save hole:', e.message)
        return
      } catch {
        console.error('Failed to save hole:', e)
        return
      }
    }
  }

  const history = t.ballPositionHistory
  const finalPos = t.ballPosition
  const allPositions = [...history, finalPos]

  const moves = []
  for (let i = 0; i < allPositions.length - 1; i++) {
    moves.push({
      from_x: allPositions[i][0],
      from_y: allPositions[i][1],
      to_x: allPositions[i + 1][0],
      to_y: allPositions[i + 1][1]
    })
  }

  try {
    await api.post('/holeplays', {
      hole_id: holeId,
      moves
    })
    saved.value = true
  } catch (e) {
    console.error('Failed to save play:', e)
  }
}

function tilePath(corners: { tl: number; tr: number; bl: number; br: number }): string {
  return `
    M ${0.5 + corners.tl} 0.5
    H ${9.5 - corners.tr}
    A ${corners.tr} ${corners.tr} 0 0 1 9.5 ${0.5 + corners.tr}
    V ${9.5 - corners.br}
    A ${corners.br} ${corners.br} 0 0 1 ${9.5 - corners.br} 9.5
    H ${0.5 + corners.bl}
    A ${corners.bl} ${corners.bl} 0 0 1 0.5 ${9.5 - corners.bl}
    V ${0.5 + corners.tl}
    A ${corners.tl} ${corners.tl} 0 0 1 ${0.5 + corners.tl} 0.5
  `
}
</script>

<template>
  <div class="map-wrapper">
    <svg
      class="map"
      :class="{ finished: game.finished }"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
    >
      <template v-for="(row, rowIndex) in game.terrain.map" :key="rowIndex">
        <g
          v-for="(tile, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :transform="`translate(${colIndex * 10} ${rowIndex * 10})`"
          class="tile"
          :class="[
            terrainColors[tile as TerrainSymbol],
            {
              hole: isHole(rowIndex, colIndex),
              start: isStart(rowIndex, colIndex),
              landing: game.isLanding(colIndex, rowIndex)
            }
          ]"
          tabindex="0"
          role="button"
          @click="handleTileClick(rowIndex, colIndex)"
          @keydown.enter="handleTileClick(rowIndex, colIndex)"
        >
          <rect x="0" y="0" width="10" height="10" :fill="backgroundColor" />
          <path :d="tilePath(getCornerRadii(rowIndex, colIndex, tile as TerrainSymbol))" />
          <circle
            v-if="isBall(rowIndex, colIndex)"
            cx="5"
            cy="5"
            r="2.5"
            class="ball"
            stroke="#666"
            stroke-width="0.5"
          />
        </g>
      </template>
    </svg>

    <div v-if="game.finished" class="overlay">
      <h1>Congratulations!</h1>
      <p class="stroke-count">{{ game.strokes }} strokes (par {{ game.par }})</p>
      <template v-if="auth.isLoggedIn">
        <button v-if="!saved" class="save-btn" @click="saveHolePlay">
          Save Play
        </button>
        <p v-else class="saved-msg">Play saved!</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map {
  display: block;
  border: 2px solid #333;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

.map.finished {
  filter: blur(3px);
}

.tile { cursor: pointer; }
.tile.grass path { fill: #161; }
.tile.water path { fill: #33f; }
.tile.sand path { fill: #fa3; }
.tile.fairway path { fill: #3a3; }
.tile.tree path { fill: #666; }
.tile.start path { fill: rgb(170, 51, 138); }
.tile.hole path { fill: #111; }
.ball { fill: #d6d6d6; }

.tile:hover rect { fill: #444; }
.tile.landing rect { fill: #f77; }

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.overlay h1 {
  color: #ffeaea;
  font-size: clamp(1.5em, 5vw, 4em);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 0 1rem;
}

.stroke-count {
  color: #ccc;
  font-size: clamp(0.9rem, 2.5vw, 1.2rem);
  margin-top: 0.5rem;
}

.save-btn {
  margin-top: 1rem;
  background-color: #99a29b;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 1rem;
  -webkit-tap-highlight-color: transparent;
}

.save-btn:hover {
  background-color: #aab4ac;
}

.save-btn:active {
  background-color: #bbc4bd;
}

.saved-msg {
  color: #7c7;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .map {
    border-radius: 0;
    border-left: none;
    border-right: none;
    box-shadow: none;
  }
}
</style>

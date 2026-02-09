<script setup lang="ts">
import { computed } from 'vue'
import { Terrain, type TerrainSymbol } from '@/lib/terrain'

const props = defineProps<{
  terrain: Terrain
  ballPosition: [number, number]
  /** All positions visited so far (for drawing the path) */
  pathPositions: [number, number][]
}>()

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
  const map = props.terrain.map
  const H = props.terrain.height
  const W = props.terrain.width

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

function isHole(row: number, col: number): boolean {
  return props.terrain.holePosition[0] === col && props.terrain.holePosition[1] === row
}

function isBall(row: number, col: number): boolean {
  return props.ballPosition[0] === col && props.ballPosition[1] === row
}

const viewBox = computed(() =>
  `0 0 ${props.terrain.width * 10} ${props.terrain.height * 10}`
)

/** SVG polyline points string for the path taken so far */
const pathPoints = computed(() => {
  return props.pathPositions
    .map(([x, y]) => `${x * 10 + 5},${y * 10 + 5}`)
    .join(' ')
})

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
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
    >
      <template v-for="(row, rowIndex) in terrain.map" :key="rowIndex">
        <g
          v-for="(tile, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :transform="`translate(${colIndex * 10} ${rowIndex * 10})`"
          class="tile"
          :class="[
            terrainColors[tile as TerrainSymbol],
            { hole: isHole(rowIndex, colIndex) }
          ]"
        >
          <rect x="0" y="0" width="10" height="10" :fill="backgroundColor" />
          <path :d="tilePath(getCornerRadii(rowIndex, colIndex, tile as TerrainSymbol))" />
        </g>
      </template>

      <!-- Path trail -->
      <polyline
        v-if="pathPositions.length > 1"
        :points="pathPoints"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        stroke-width="1"
        stroke-dasharray="2,2"
        stroke-linecap="round"
      />

      <!-- Path dots -->
      <circle
        v-for="(pos, i) in pathPositions"
        :key="`dot-${i}`"
        :cx="pos[0] * 10 + 5"
        :cy="pos[1] * 10 + 5"
        r="1.2"
        fill="rgba(255,255,255,0.4)"
      />

      <!-- Ball -->
      <circle
        :cx="ballPosition[0] * 10 + 5"
        :cy="ballPosition[1] * 10 + 5"
        r="2.5"
        class="ball"
        stroke="#666"
        stroke-width="0.5"
      >
        <animate
          attributeName="r"
          values="2.5;3;2.5"
          dur="0.3s"
          begin="indefinite"
        />
      </circle>
    </svg>
  </div>
</template>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.map {
  border: 2px solid #333;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  margin: 0 auto;
  width: 100%;
  max-width: 420px;
  height: auto;
}

.tile.grass path { fill: #161; }
.tile.water path { fill: #33f; }
.tile.sand path { fill: #fa3; }
.tile.fairway path { fill: #3a3; }
.tile.tree path { fill: #666; }
.tile.hole path { fill: #111; }
.ball { fill: #d6d6d6; }

@media (max-width: 768px) {
  .map-wrapper { width: 100%; }
}
</style>

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { Terrain, type TerrainData } from '@/lib/terrain'
import { Dice } from '@/lib/dice'
import { api } from '@/api'

/** Placeholder terrain data used before the first API call completes */
const PLACEHOLDER_DATA: TerrainData = {
  map: [['g']],
  ball_position: [0, 0],
  hole_position: [0, 0],
  start_position: [0, 0],
  par: 1,
  seed: 'loading0',
  width: 1,
  height: 1
}

async function fetchTerrain(seed: string, width: number, height: number): Promise<TerrainData> {
  return api.get<TerrainData>(`/terrain/generate?seed=${seed}&width=${width}&height=${height}`)
}

export const useGameStore = defineStore('game', () => {
  const terrain = ref<Terrain>(new Terrain(PLACEHOLDER_DATA))
  const dice = reactive(new Dice(8))
  const landingPositions = ref<[number, number][]>([])
  const loading = ref(false)

  const finished = computed(() => terrain.value.finished)
  const strokes = computed(() => terrain.value.strokes)
  const distance = computed(() => terrain.value.distance)
  const par = computed(() => terrain.value.par)

  async function initTerrain(seed: string, width: number, height: number, id: number = -1) {
    loading.value = true
    const data = await fetchTerrain(seed, width, height)
    terrain.value = new Terrain(data, id)
    dice.reset(8)
    landingPositions.value = []
    noMoves.value = false
    loading.value = false
  }

  async function regenerate(seed: string, width: number, height: number) {
    loading.value = true
    const data = await fetchTerrain(seed, width, height)
    terrain.value.loadData(data)
    dice.reset(8)
    landingPositions.value = []
    noMoves.value = false
    loading.value = false
  }

  /** True when the last roll had no valid landing positions (wasted stroke) */
  const noMoves = ref(false)

  function _handleRoll(roll: number): void {
    const positions = terrain.value.getLandingPositions(roll)
    if (positions.length === 0) {
      // No valid destinations — count as a wasted stroke, let user re-roll
      terrain.value.ballPositionHistory.push([...terrain.value.ballPosition])
      noMoves.value = true
      dice.unlock()
      landingPositions.value = []
    } else {
      noMoves.value = false
      landingPositions.value = positions
    }
  }

  function rollDice(): number | null {
    if (dice.locked || finished.value) return null
    noMoves.value = false
    const roll = dice.roll()
    _handleRoll(roll.result)
    return roll.result
  }

  function puttDice(): number | null {
    if (dice.locked || finished.value) return null
    noMoves.value = false
    const roll = dice.putt()
    _handleRoll(roll.result)
    return roll.result
  }

  function moveTo(col: number, row: number): boolean {
    if (!dice.lastRoll) return false
    const success = terrain.value.moveBall(dice.lastRoll.result, [col, row])
    if (success) {
      dice.unlock()
      landingPositions.value = []
      noMoves.value = false
      const tile = terrain.value.map[row][col]
      if (tile === 's') dice.setMaxRoll(2)
      else if (tile === 'f') dice.setMaxRoll(8)
      else dice.setMaxRoll(6)
      if (terrain.value.finished) {
        dice.locked = true
      }
    }
    return success
  }

  function isLanding(col: number, row: number): boolean {
    return landingPositions.value.some(([x, y]) => x === col && y === row)
  }

  return {
    terrain,
    dice,
    landingPositions,
    loading,
    noMoves,
    finished,
    strokes,
    distance,
    par,
    initTerrain,
    regenerate,
    rollDice,
    puttDice,
    moveTo,
    isLanding
  }
})

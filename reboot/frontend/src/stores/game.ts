import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { Terrain } from '@/lib/terrain'
import { Dice } from '@/lib/dice'

export const useGameStore = defineStore('game', () => {
  const terrain = ref<Terrain>(new Terrain('not00set', 10, 15))
  const dice = reactive(new Dice(8))
  const landingPositions = ref<[number, number][]>([])

  const finished = computed(() => terrain.value.finished)
  const strokes = computed(() => terrain.value.strokes)
  const distance = computed(() => terrain.value.distance)
  const par = computed(() => terrain.value.par)

  function initTerrain(seed: string, width: number, height: number, id: number = -1) {
    terrain.value = new Terrain(seed, width, height, id)
    dice.reset(8)
    landingPositions.value = []
  }

  function regenerate(seed: string, width: number, height: number) {
    terrain.value.regenerate(seed, width, height)
    dice.reset(8)
    landingPositions.value = []
  }

  function rollDice(): number | null {
    if (dice.locked || finished.value) return null
    const roll = dice.roll()
    landingPositions.value = terrain.value.getLandingPositions(roll.result)
    return roll.result
  }

  function puttDice(): number | null {
    if (dice.locked || finished.value) return null
    const roll = dice.putt()
    landingPositions.value = terrain.value.getLandingPositions(roll.result)
    return roll.result
  }

  function moveTo(col: number, row: number): boolean {
    if (!dice.lastRoll) return false
    const success = terrain.value.moveBall(dice.lastRoll.result, [col, row])
    if (success) {
      dice.unlock()
      landingPositions.value = []
      // Update dice max based on terrain type
      const tile = terrain.value.map[row][col]
      if (tile === 's') dice.setMaxRoll(2)
      else if (tile === 'f') dice.setMaxRoll(8)
      else dice.setMaxRoll(6)
      // Lock dice if finished
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

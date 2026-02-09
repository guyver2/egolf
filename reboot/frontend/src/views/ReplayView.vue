<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api'
import { Terrain, type TerrainData } from '@/lib/terrain'
import ReplayMap from '@/components/ReplayMap.vue'

interface Move {
  id: number
  move_order: number
  from_x: number
  from_y: number
  to_x: number
  to_y: number
}

interface HolePlayData {
  id: number
  hole_id: number
  user_id: number
  strokes: number
  created_at: string
  user_name: string | null
  hole_name: string | null
  hole_seed: string | null
  hole_width: number | null
  hole_height: number | null
  moves: Move[]
}

const route = useRoute()

const loading = ref(true)
const error = ref('')
const play = ref<HolePlayData | null>(null)
const terrain = ref<Terrain | null>(null)

// Replay state
const currentStep = ref(0)
const isPlaying = ref(false)
const speed = ref(500) // ms per step
let timer: ReturnType<typeof setInterval> | null = null

// Derived positions
const positions = computed<[number, number][]>(() => {
  if (!play.value || !play.value.moves.length) return []
  const moves = play.value.moves
  // Build the full list of positions from moves
  const result: [number, number][] = [[moves[0].from_x, moves[0].from_y]]
  for (const m of moves) {
    result.push([m.to_x, m.to_y])
  }
  return result
})

const totalSteps = computed(() => {
  return positions.value.length > 0 ? positions.value.length - 1 : 0
})

const ballPosition = computed<[number, number]>(() => {
  if (positions.value.length === 0) return [0, 0]
  return positions.value[currentStep.value]
})

/** All positions visited up to current step (for path drawing) */
const pathPositions = computed<[number, number][]>(() => {
  return positions.value.slice(0, currentStep.value + 1)
})

const isFinished = computed(() => currentStep.value >= totalSteps.value)

function stepForward() {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
  } else {
    pause()
  }
}

function stepBackward() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function startPlayback() {
  if (isFinished.value) {
    currentStep.value = 0
  }
  isPlaying.value = true
  timer = setInterval(() => {
    if (currentStep.value < totalSteps.value) {
      currentStep.value++
    } else {
      pause()
    }
  }, speed.value)
}

function pause() {
  isPlaying.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function reset() {
  pause()
  currentStep.value = 0
}

function setSpeed(ms: number) {
  speed.value = ms
  if (isPlaying.value) {
    pause()
    startPlayback()
  }
}

onMounted(async () => {
  try {
    const playId = Number(route.params.id)
    play.value = await api.get<HolePlayData>(`/holeplays/${playId}`)

    if (play.value.hole_seed && play.value.hole_width && play.value.hole_height) {
      const terrainData = await api.get<TerrainData>(
        `/terrain/generate?seed=${play.value.hole_seed}&width=${play.value.hole_width}&height=${play.value.hole_height}`
      )
      terrain.value = new Terrain(terrainData, play.value.hole_id)
    } else {
      error.value = 'Missing hole data for replay'
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load replay'
  }
  loading.value = false
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="page-container">
    <div v-if="loading" class="loading">Loading replay...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else-if="play && terrain">
      <div class="replay-header">
        <h2>{{ play.hole_name || `Hole #${play.hole_id}` }}</h2>
        <span class="meta">
          by {{ play.user_name }} &mdash;
          {{ play.strokes }} strokes &mdash;
          {{ new Date(play.created_at).toLocaleDateString() }}
        </span>
      </div>

      <div class="content-wrapper">
        <div class="map-area">
          <ReplayMap
            :terrain="terrain"
            :ball-position="ballPosition"
            :path-positions="pathPositions"
          />
        </div>

        <div class="controls-panel">
          <div class="step-display">
            Move {{ currentStep }} / {{ totalSteps }}
          </div>

          <div class="playback-controls">
            <button @click="reset" title="Reset">
              &#x23EE;
            </button>
            <button @click="stepBackward" :disabled="currentStep === 0" title="Step back">
              &#x23EA;
            </button>
            <button v-if="!isPlaying" @click="startPlayback" title="Play">
              &#x25B6;
            </button>
            <button v-else @click="pause" title="Pause">
              &#x23F8;
            </button>
            <button @click="stepForward" :disabled="isFinished" title="Step forward">
              &#x23E9;
            </button>
          </div>

          <div class="speed-controls">
            <span>Speed:</span>
            <button
              :class="{ active: speed === 1000 }"
              @click="setSpeed(1000)"
            >0.5x</button>
            <button
              :class="{ active: speed === 500 }"
              @click="setSpeed(500)"
            >1x</button>
            <button
              :class="{ active: speed === 250 }"
              @click="setSpeed(250)"
            >2x</button>
            <button
              :class="{ active: speed === 100 }"
              @click="setSpeed(100)"
            >4x</button>
          </div>

          <div v-if="isFinished && currentStep > 0" class="finished-msg">
            Replay complete!
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-container {
  margin-top: 60px;
  background-color: #1a1a1a;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading, .error {
  color: #ccc;
  font-size: 1.2rem;
  margin-top: 4rem;
}
.error { color: #ff5757; }

.replay-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.replay-header h2 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.meta {
  color: #999;
  font-size: 0.9rem;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  width: 100%;
  align-items: flex-start;
}

.map-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  background-color: #272727;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  width: 220px;
  position: sticky;
  top: 80px;
}

.step-display {
  text-align: center;
  font-size: 1.1rem;
  color: #ccc;
}

.playback-controls {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.playback-controls button {
  background-color: #444;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.playback-controls button:hover:not(:disabled) {
  background-color: #555;
}

.playback-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.speed-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.speed-controls span {
  color: #999;
  font-size: 0.85rem;
}

.speed-controls button {
  background-color: #333;
  color: #ccc;
  border: 1px solid #555;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.speed-controls button.active {
  background-color: #555;
  color: white;
  border-color: #888;
}

.speed-controls button:hover {
  background-color: #444;
}

.finished-msg {
  text-align: center;
  color: #7c7;
  font-size: 1rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
  .map-area {
    max-width: 100%;
    max-height: 60vh;
  }
  .controls-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-self: stretch;
  }
}
</style>

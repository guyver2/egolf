<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'

const props = defineProps<{
  showRandomButton?: boolean
  showSaveButton?: boolean
}>()

const game = useGameStore()
const auth = useAuthStore()

const editingSeed = ref(false)
const seedInput = ref(game.terrain.seed)

function handleSeedSubmit() {
  let seed = seedInput.value
    .replace(/[^a-zA-Z0-9]/g, '0')
    .slice(0, 8)
    .padEnd(8, '0')
  seedInput.value = seed
  editingSeed.value = false
  game.regenerate(seed, game.terrain.width, game.terrain.height)
}

function randomSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let seed = ''
  for (let i = 0; i < 8; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  seedInput.value = seed
  game.regenerate(seed, game.terrain.width, game.terrain.height)
}

function retry() {
  game.regenerate(game.terrain.seed, game.terrain.width, game.terrain.height)
}

async function saveHole() {
  if (!auth.user) return
  try {
    await api.post('/holes', {
      name: 'Hole ' + game.terrain.seed,
      seed: game.terrain.seed,
      width: game.terrain.width,
      height: game.terrain.height
    })
  } catch (e: any) {
    console.error('Failed to save hole:', e.message)
  }
}

function formattedSeed(): string {
  const s = game.terrain.seed
  return s.slice(0, 4) + '-' + s.slice(4, 8)
}
</script>

<template>
  <div class="hole-info-container">
    <div class="main-info">
      <p>Par: {{ game.par }}</p>
      <p>Strokes: {{ game.strokes }}</p>
      <p>Distance: {{ game.distance }}</p>
    </div>
    <div class="seed-controls">
      <p>
        Seed:
        <input
          v-if="editingSeed"
          v-model="seedInput"
          type="text"
          maxlength="8"
          @blur="handleSeedSubmit"
          @keydown.enter="handleSeedSubmit"
        />
        <button v-else class="seed-display" @click="editingSeed = true">
          {{ formattedSeed() }}
        </button>
      </p>
      <div class="button-group">
        <button v-if="props.showRandomButton !== false" class="seed-button" @click="randomSeed">
          Random
        </button>
        <button class="seed-button" @click="retry">Retry</button>
        <button
          v-if="props.showSaveButton !== false && auth.isLoggedIn"
          class="seed-button"
          @click="saveHole"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hole-info-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  color: white;
  gap: 5px;
  padding: 0.5rem;
  min-width: 120px;
}

.main-info {
  display: flex;
  gap: 1rem;
}

.seed-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

input {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 2px 4px;
  width: 80px;
  max-width: 100%;
}

.seed-display {
  background: transparent;
  border: 1px solid #666;
  color: white;
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 3px;
  font-size: inherit;
}

.seed-display:hover {
  border-color: white;
}

.seed-button {
  background-color: #99a29b;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 0.9rem;
}

.seed-button:hover {
  background-color: #aab4ac;
}

@media (max-width: 768px) {
  .hole-info-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 1rem;
  }
  .main-info { font-size: 0.9rem; }
  .seed-controls {
    flex-direction: row;
    align-items: center;
  }
  p { margin: 0; }
}

@media (max-width: 480px) {
  .main-info { font-size: 0.8rem; gap: 0.5rem; }
  .seed-button { padding: 4px 8px; font-size: 0.8rem; }
}
</style>

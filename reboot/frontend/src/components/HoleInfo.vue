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

async function handleSeedSubmit() {
  let seed = seedInput.value
    .replace(/[^a-zA-Z0-9]/g, '0')
    .slice(0, 8)
    .padEnd(8, '0')
  seedInput.value = seed
  editingSeed.value = false
  await game.regenerate(seed, game.terrain.width, game.terrain.height)
}

async function randomSeed() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let seed = ''
  for (let i = 0; i < 8; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  seedInput.value = seed
  await game.regenerate(seed, game.terrain.width, game.terrain.height)
}

async function retry() {
  await game.regenerate(game.terrain.seed, game.terrain.width, game.terrain.height)
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
      <p>Dist: {{ game.distance }}</p>
    </div>
    <div class="seed-controls">
      <p class="seed-line">
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
  min-width: 0;
}

.main-info {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.seed-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.seed-line {
  font-size: 0.9rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

input {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 2px 4px;
  width: 80px;
  max-width: 100%;
  font-size: inherit;
}

.seed-display {
  background: transparent;
  border: 1px solid #666;
  color: white;
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 3px;
  font-size: inherit;
  -webkit-tap-highlight-color: transparent;
}

.seed-display:hover {
  border-color: white;
}

.seed-button {
  background-color: #99a29b;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 0.85rem;
  -webkit-tap-highlight-color: transparent;
}

.seed-button:hover {
  background-color: #aab4ac;
}

.seed-button:active {
  background-color: #bbc4bd;
}

@media (max-width: 768px) {
  .hole-info-container {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
  }
  .main-info {
    font-size: 0.8rem;
    gap: 0.5rem;
  }
  .seed-controls {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .seed-line {
    font-size: 0.8rem;
  }
  .seed-button {
    padding: 5px 10px;
    font-size: 0.8rem;
  }
  p { margin: 0; }
}
</style>

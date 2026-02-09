<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  if (!auth.isLoggedIn) {
    router.replace('/login')
  }
})

const name = ref('')
const seed = ref(randomSeedString())
const width = ref(10)
const height = ref(15)

const saving = ref(false)
const saveError = ref('')
const previewKey = ref(0) // bump to force image reload

function randomSeedString(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < 8; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return s
}

function sanitiseSeed(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '0').slice(0, 8).padEnd(8, '0')
}

const previewUrl = computed(() => {
  const s = sanitiseSeed(seed.value)
  // Uses the draft endpoint — generates in memory without saving to disk
  return `/api/terrain/preview/draft?seed=${s}&width=${width.value}&height=${height.value}&_=${previewKey.value}`
})

const displaySeed = computed(() => {
  const s = sanitiseSeed(seed.value)
  return s.slice(0, 4) + '-' + s.slice(4, 8)
})

function randomize() {
  seed.value = randomSeedString()
  previewKey.value++
}

function refreshPreview() {
  seed.value = sanitiseSeed(seed.value)
  previewKey.value++
}

async function saveHole() {
  saveError.value = ''
  saving.value = true
  const cleanSeed = sanitiseSeed(seed.value)
  const holeName = name.value.trim() || `Hole ${cleanSeed}`

  try {
    const hole = await api.post<{ id: number }>('/holes', {
      name: holeName,
      seed: cleanSeed,
      width: width.value,
      height: height.value,
    })
    router.push(`/play/hole/${hole.id}`)
  } catch (e: any) {
    saveError.value = e.message || 'Failed to save hole'
  }
  saving.value = false
}
</script>

<template>
  <div class="page-container">
    <h1>Create a Hole</h1>

    <div class="create-layout">
      <div class="preview-area">
        <img
          :src="previewUrl"
          alt="Terrain preview"
          class="terrain-preview"
          loading="eager"
        />
        <p class="preview-label">{{ width }}x{{ height }} &middot; {{ displaySeed }}</p>
      </div>

      <div class="form-area">
        <div class="field">
          <label for="hole-name">Name</label>
          <input
            id="hole-name"
            v-model="name"
            type="text"
            placeholder="e.g. Windy Shores"
            maxlength="200"
          />
        </div>

        <div class="field">
          <label for="hole-seed">Seed</label>
          <div class="seed-row">
            <input
              id="hole-seed"
              v-model="seed"
              type="text"
              maxlength="8"
              @blur="refreshPreview"
              @keydown.enter="refreshPreview"
            />
            <button class="btn btn-small" @click="randomize">Random</button>
          </div>
        </div>

        <div class="field">
          <label for="hole-width">Width ({{ width }})</label>
          <input
            id="hole-width"
            v-model.number="width"
            type="range"
            min="5"
            max="30"
            @change="refreshPreview"
          />
        </div>

        <div class="field">
          <label for="hole-height">Height ({{ height }})</label>
          <input
            id="hole-height"
            v-model.number="height"
            type="range"
            min="5"
            max="40"
            @change="refreshPreview"
          />
        </div>

        <button class="btn btn-primary" :disabled="saving" @click="saveHole">
          {{ saving ? 'Saving...' : 'Save & Play' }}
        </button>

        <p v-if="saveError" class="error">{{ saveError }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  margin-top: 56px;
  padding: 1.5rem 1rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

h1 {
  margin-bottom: 1.5rem;
}

.create-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.terrain-preview {
  width: 220px;
  height: auto;
  border-radius: 6px;
  border: 2px solid #444;
  image-rendering: pixelated;
  background-color: #1a1a1a;
}

.preview-label {
  color: #888;
  font-size: 0.85rem;
}

.form-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  color: #aaa;
  font-size: 0.85rem;
  font-weight: 600;
}

.field input[type="text"] {
  background-color: #1e1e1e;
  border: 1px solid #555;
  color: #eee;
  padding: 0.6rem 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  -webkit-appearance: none;
}

.field input[type="text"]:focus {
  outline: none;
  border-color: #888;
}

.field input[type="range"] {
  accent-color: #7c7;
  width: 100%;
}

.seed-row {
  display: flex;
  gap: 0.5rem;
}

.seed-row input {
  flex: 1;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.btn-small {
  background-color: #444;
  color: #ccc;
  padding: 0.5rem 0.75rem;
  flex-shrink: 0;
}

.btn-small:hover {
  background-color: #555;
}

.btn-primary {
  background-color: #3a3;
  color: white;
  font-size: 1rem;
  padding: 0.75rem 1.25rem;
  margin-top: 0.5rem;
}

.btn-primary:hover {
  background-color: #4b4;
}

.btn-primary:active {
  background-color: #5c5;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff5757;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .page-container {
    padding: 1rem 0.75rem;
  }

  .create-layout {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .preview-area {
    align-items: center;
  }

  .terrain-preview {
    width: min(200px, 60vw);
  }
}
</style>

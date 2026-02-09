<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '@/api'

interface Hole {
  id: number
  name: string
  seed: string
  width: number
  height: number
  author_id: number | null
  author_name: string | null
  created_at: string
}

interface HoleListResponse {
  holes: Hole[]
  total: number
  page: number
  limit: number
  pages: number
}

const holes = ref<Hole[]>([])
const page = ref(0)
const totalPages = ref(0)
const loading = ref(true)

async function fetchHoles() {
  loading.value = true
  try {
    const res = await api.get<HoleListResponse>(`/holes?page=${page.value}&limit=20`)
    holes.value = res.holes
    totalPages.value = res.pages
  } catch (e) {
    console.error('Failed to fetch holes:', e)
  }
  loading.value = false
}

onMounted(fetchHoles)
watch(page, fetchHoles)
</script>

<template>
  <div class="page-container">
    <h1>Holes</h1>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="holes.length === 0" class="empty">No holes found.</div>

    <div v-else class="holes-grid">
      <div v-for="hole in holes" :key="hole.id" class="hole-card">
        <img
          :src="`/api/terrain/preview?seed=${hole.seed}&width=${hole.width}&height=${hole.height}`"
          :alt="`Preview of ${hole.name}`"
          class="hole-preview"
          loading="lazy"
        />
        <div class="hole-info">
          <h2>{{ hole.name }}</h2>
          <p>Size: {{ hole.width }}x{{ hole.height }}</p>
          <p>Author: {{ hole.author_name || 'System' }}</p>
          <p class="date-text">{{ new Date(hole.created_at).toDateString() }}</p>
        </div>
        <div class="hole-actions">
          <router-link :to="`/play/hole/${hole.id}`" class="button">Play</router-link>
          <router-link :to="`/holes/${hole.id}/replays`" class="button button-secondary">Replays</router-link>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page === 0" @click="page--">Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages }}</span>
      <button :disabled="page >= totalPages - 1" @click="page++">Next</button>
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

.loading, .empty {
  color: #ccc;
  text-align: center;
  margin-top: 2rem;
}

.holes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hole-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  background-color: #272727;
}

.hole-preview {
  width: 72px;
  height: auto;
  border-radius: 4px;
  border: 1px solid #555;
  flex-shrink: 0;
  image-rendering: pixelated;
}

.hole-info {
  flex: 1;
  min-width: 0;
}

.hole-info h2 {
  font-size: 1.05rem;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hole-info p {
  color: #aaa;
  font-size: 0.85rem;
  margin: 0.1rem 0;
}

.date-text {
  font-size: 0.8rem !important;
  color: #777 !important;
}

.hole-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  -webkit-tap-highlight-color: transparent;
}

.button:hover {
  background-color: #555;
}

.button:active {
  background-color: #666;
}

.button-secondary {
  background-color: transparent;
  border: 1px solid #555;
  color: #ccc;
}

.button-secondary:hover {
  background-color: #333;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-bottom: 1rem;
}

.pagination button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  -webkit-tap-highlight-color: transparent;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination span {
  color: #ccc;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .page-container {
    padding: 1rem 0.75rem;
  }

  .hole-card {
    flex-wrap: wrap;
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .hole-preview {
    width: 56px;
  }

  .hole-info {
    flex: 1;
    min-width: calc(100% - 56px - 0.75rem);
  }

  .hole-info h2 {
    font-size: 0.95rem;
  }

  .hole-info p {
    font-size: 0.8rem;
  }

  .hole-actions {
    flex-direction: row;
    width: 100%;
    gap: 0.5rem;
  }

  .button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
}
</style>

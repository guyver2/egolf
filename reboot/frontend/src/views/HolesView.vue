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
        <div class="hole-info">
          <h2>{{ hole.name }}</h2>
          <p>Seed: {{ hole.seed }}</p>
          <p>Size: {{ hole.width }}x{{ hole.height }}</p>
          <p>Author: {{ hole.author_name || 'System' }}</p>
          <p>Created: {{ new Date(hole.created_at).toDateString() }}</p>
        </div>
        <div class="hole-actions">
          <router-link :to="`/play/hole/${hole.id}`" class="button">Play</router-link>
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
  margin-top: 60px;
  padding: 2rem 1rem;
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
  gap: 1rem;
}

.hole-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  background-color: #272727;
}

.hole-info h2 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.hole-info p {
  color: #aaa;
  font-size: 0.9rem;
  margin: 0.15rem 0;
}

.hole-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.2s;
}

.button:hover {
  background-color: #555;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  background-color: #444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination span {
  color: #ccc;
}
</style>

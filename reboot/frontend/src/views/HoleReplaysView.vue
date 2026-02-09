<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api'

interface HolePlay {
  id: number
  hole_id: number
  user_id: number
  strokes: number
  created_at: string
  user_name: string | null
  hole_name: string | null
}

interface HolePlayListResponse {
  hole_plays: HolePlay[]
  total: number
  page: number
  limit: number
  pages: number
}

interface Hole {
  id: number
  name: string
  seed: string
  width: number
  height: number
  author_name: string | null
}

const route = useRoute()
const holeId = Number(route.params.id)

const hole = ref<Hole | null>(null)
const plays = ref<HolePlay[]>([])
const page = ref(0)
const totalPages = ref(0)
const total = ref(0)
const loading = ref(true)
const error = ref('')

async function fetchHole() {
  hole.value = await api.get<Hole>(`/holes/${holeId}`)
}

async function fetchReplays() {
  loading.value = true
  try {
    const res = await api.get<HolePlayListResponse>(
      `/holeplays?hole_id=${holeId}&sort=best&page=${page.value}&limit=20`
    )
    plays.value = res.hole_plays
    totalPages.value = res.pages
    total.value = res.total
  } catch (e: any) {
    error.value = e.message || 'Failed to load replays'
  }
  loading.value = false
}

onMounted(async () => {
  try {
    await fetchHole()
  } catch (e: any) {
    error.value = e.message || 'Hole not found'
    loading.value = false
    return
  }
  await fetchReplays()
})

watch(page, fetchReplays)
</script>

<template>
  <div class="page-container">
    <div v-if="error" class="error">{{ error }}</div>
    <template v-else>
      <div class="header">
        <h1 v-if="hole">{{ hole.name }} — Best Replays</h1>
        <p v-if="hole" class="hole-meta">
          {{ hole.width }}x{{ hole.height }} · Seed {{ hole.seed }}
          <span v-if="hole.author_name"> · by {{ hole.author_name }}</span>
        </p>
        <p class="total-count" v-if="!loading">{{ total }} replay{{ total !== 1 ? 's' : '' }}</p>
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <div v-else-if="plays.length === 0" class="empty">
        No replays recorded for this hole yet.
      </div>

      <div v-else class="replays-list">
        <div
          v-for="(play, idx) in plays"
          :key="play.id"
          class="replay-row"
        >
          <span class="rank">#{{ page * 20 + idx + 1 }}</span>
          <span class="player">{{ play.user_name || 'Unknown' }}</span>
          <span class="strokes">{{ play.strokes }} stroke{{ play.strokes !== 1 ? 's' : '' }}</span>
          <span class="date">{{ new Date(play.created_at).toLocaleDateString() }}</span>
          <router-link :to="`/replay/${play.id}`" class="watch-btn">Watch</router-link>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page === 0" @click="page--">Previous</button>
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <button :disabled="page >= totalPages - 1" @click="page++">Next</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-container {
  margin-top: 60px;
  padding: 2rem 1rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.header {
  margin-bottom: 1.5rem;
}

.header h1 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.hole-meta {
  color: #999;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.total-count {
  color: #777;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.loading, .empty, .error {
  color: #ccc;
  text-align: center;
  margin-top: 2rem;
}

.error {
  color: #ff5757;
}

.replays-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.replay-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: #272727;
  border-radius: 6px;
  border: 1px solid #333;
}

.rank {
  color: #888;
  font-weight: bold;
  min-width: 36px;
}

.player {
  flex: 1;
  color: #ddd;
}

.strokes {
  color: #7c7;
  font-weight: 600;
  min-width: 90px;
  text-align: right;
}

.date {
  color: #888;
  font-size: 0.85rem;
  min-width: 90px;
  text-align: right;
}

.watch-btn {
  background-color: #444;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.watch-btn:hover {
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

@media (max-width: 600px) {
  .replay-row {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .date {
    display: none;
  }
}
</style>

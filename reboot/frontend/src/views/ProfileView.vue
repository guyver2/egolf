<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { api } from '@/api'

const auth = useAuthStore()
const router = useRouter()

interface Move {
  id: number
  move_order: number
  from_x: number
  from_y: number
  to_x: number
  to_y: number
}

interface HolePlay {
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

interface HolePlayListResponse {
  hole_plays: HolePlay[]
  total: number
  page: number
  limit: number
  pages: number
}

const plays = ref<HolePlay[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    const res = await api.get<HolePlayListResponse>(
      `/holeplays?user_id=${auth.user!.id}&limit=50`
    )
    plays.value = res.hole_plays
  } catch (e) {
    console.error('Failed to fetch plays:', e)
  }
  loading.value = false
})
</script>

<template>
  <div class="page-container">
    <h1>Profile — {{ auth.user?.username }}</h1>

    <h2>Your Plays</h2>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="plays.length === 0" class="empty">No plays recorded yet.</div>

    <div v-else class="plays-list">
      <div v-for="play in plays" :key="play.id" class="play-card">
        <div class="play-info">
          <h3>{{ play.hole_name || `Hole #${play.hole_id}` }}</h3>
          <p>Strokes: {{ play.strokes }}</p>
          <p>Played: {{ new Date(play.created_at).toLocaleDateString() }}</p>
          <p v-if="play.hole_width && play.hole_height">
            Size: {{ play.hole_width }}x{{ play.hole_height }}
          </p>
        </div>
        <div class="play-actions">
          <router-link :to="`/replay/${play.id}`" class="button">Replay</router-link>
          <router-link :to="`/play/hole/${play.hole_id}`" class="button secondary">
            Play Again
          </router-link>
        </div>
      </div>
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
  margin-bottom: 0.5rem;
}

h2 {
  margin: 1.5rem 0 1rem;
  color: #ccc;
  font-size: 1.1rem;
}

.loading, .empty {
  color: #ccc;
  text-align: center;
  margin-top: 2rem;
}

.plays-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.play-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  background-color: #272727;
}

.play-info h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.play-info p {
  color: #aaa;
  font-size: 0.85rem;
  margin: 0.1rem 0;
}

.play-actions {
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
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.button:hover {
  background-color: #555;
}

.button.secondary {
  background-color: #333;
}

.button.secondary:hover {
  background-color: #444;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import GameMap from '@/components/GameMap.vue'
import DiceRoller from '@/components/DiceRoller.vue'
import HoleInfo from '@/components/HoleInfo.vue'
import { useGameStore } from '@/stores/game'
import { api } from '@/api'

const route = useRoute()
const game = useGameStore()
const loading = ref(true)
const error = ref('')

interface HoleData {
  id: number
  name: string
  seed: string
  width: number
  height: number
}

onMounted(async () => {
  try {
    const holeId = Number(route.params.id)
    const hole = await api.get<HoleData>(`/holes/${holeId}`)
    game.initTerrain(hole.seed, hole.width, hole.height, hole.id)
    loading.value = false
  } catch (e: any) {
    error.value = e.message || 'Failed to load hole'
    loading.value = false
  }
})
</script>

<template>
  <div class="game-container">
    <div v-if="loading" class="loading">Loading hole...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content-wrapper">
      <div class="map-container">
        <GameMap :allow-save="true" />
      </div>
      <div class="controls-container">
        <DiceRoller />
        <HoleInfo :show-random-button="false" :show-save-button="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  margin-top: 60px;
  background-color: #1a1a1a;
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.loading, .error {
  color: #ccc;
  font-size: 1.2rem;
  margin-top: 4rem;
}

.error { color: #ff5757; }

.content-wrapper {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  width: 100%;
  align-items: flex-start;
}

.controls-container {
  display: flex;
  flex-direction: column;
  background-color: #272727;
  gap: 10px;
  padding: 1rem;
  border-radius: 8px;
  width: 200px;
  position: sticky;
  top: 80px;
}

.map-container {
  flex: 1;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .game-container {
    padding: 0;
    padding-bottom: 120px;
  }
  .content-wrapper {
    flex-direction: column;
    gap: 0;
  }
  .map-container {
    padding: 0.5rem;
  }
  .controls-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    border-radius: 8px 8px 0 0;
    padding: 0.75rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    z-index: 100;
    max-height: 20vh;
    top: auto;
  }
}
</style>

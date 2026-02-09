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
    await game.initTerrain(hole.seed, hole.width, hole.height, hole.id)
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
  margin-top: 56px;
  background-color: #1a1a1a;
  height: calc(100vh - 56px);
  display: flex;
  overflow: hidden;
}

.loading, .error {
  color: #ccc;
  font-size: 1.2rem;
  margin: 4rem auto;
}

.error { color: #ff5757; }

.content-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 8px;
}

.map-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.controls-container {
  display: flex;
  flex-direction: column;
  background-color: #272727;
  gap: 10px;
  padding: 1rem;
  border-radius: 8px;
  width: 200px;
  flex-shrink: 0;
  align-self: flex-start;
}

@media (max-width: 768px) {
  .game-container {
    height: calc(100vh - 56px);
  }
  .content-wrapper {
    flex-direction: column;
    padding: 0;
    gap: 0;
    padding-bottom: 100px;
  }
  .map-container {
    flex: 1;
    min-height: 0;
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
    border-radius: 12px 12px 0 0;
    padding: 0.5rem 0.75rem;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
    z-index: 100;
    gap: 0.25rem;
    align-self: stretch;
  }
}
</style>

<script setup lang="ts">
import { onMounted } from 'vue'
import GameMap from '@/components/GameMap.vue'
import DiceRoller from '@/components/DiceRoller.vue'
import HoleInfo from '@/components/HoleInfo.vue'
import { useGameStore } from '@/stores/game'

const game = useGameStore()

onMounted(() => {
  // Generate a random seed on mount
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let seed = ''
  for (let i = 0; i < 8; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  game.initTerrain(seed, 10, 15)
})
</script>

<template>
  <div class="game-container">
    <div class="content-wrapper">
      <div class="map-container">
        <GameMap />
      </div>
      <div class="controls-container">
        <DiceRoller />
        <HoleInfo :show-random-button="true" :show-save-button="true" />
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
  top: 80px; /* 60px navbar + 20px spacing */
}

.map-container {
  flex: 1;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .game-container {
    padding: 0;
    padding-bottom: 120px; /* Space for fixed controls */
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

@media (max-width: 480px) {
  .controls-container {
    flex-direction: column;
    padding: 0.5rem;
  }
}
</style>

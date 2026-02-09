<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'

const game = useGameStore()
const isRolling = ref(false)
const displayResult = ref<number>(3)

const diceClass = computed(() => `D${game.dice.maxRoll}`)

async function rolling() {
  if (game.dice.locked || game.finished) return
  isRolling.value = true

  // Animate through random numbers
  for (let i = 0; i < 10; i++) {
    displayResult.value = Math.floor(Math.random() * game.dice.maxRoll) + 1
    await new Promise((r) => setTimeout(r, 80))
  }

  const result = game.rollDice()
  if (result !== null) {
    displayResult.value = result
  }
  isRolling.value = false
}

function putt() {
  if (game.dice.locked || game.finished) return
  const result = game.puttDice()
  if (result !== null) {
    displayResult.value = result
  }
}

const diceDots: Record<number, string> = {
  1: 'M50 50 h0',
  2: 'M35 35 h0 M65 65 h0',
  3: 'M35 35 h0 M50 50 h0 M65 65 h0',
  4: 'M35 35 h0 M35 65 h0 M65 35 h0 M65 65 h0',
  5: 'M35 35 h0 M35 65 h0 M50 50 h0 M65 35 h0 M65 65 h0',
  6: 'M35 35 h0 M35 50 h0 M35 65 h0 M65 35 h0 M65 50 h0 M65 65 h0',
  7: 'M35 35 h0 M35 50 h0 M35 65 h0 M50 50 h0 M65 35 h0 M65 50 h0 M65 65 h0',
  8: 'M35 35 h0 M35 50 h0 M35 65 h0 M50 35 h0 M50 65 h0 M65 35 h0 M65 50 h0 M65 65 h0'
}

function dotPositions(result: number): Array<{ cx: string; cy: string }> {
  const path = diceDots[result] || ''
  return path
    .split('M')
    .filter(Boolean)
    .map((dot) => {
      const parts = dot.trim().split(' ')
      return { cx: parts[0], cy: parts[1] }
    })
}
</script>

<template>
  <div class="dice-container">
    <svg
      class="dice"
      :class="{ rolling: isRolling, locked: game.dice.locked }"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      role="button"
      tabindex="0"
      aria-label="Roll dice"
      @click="rolling"
      @keydown.enter="rolling"
    >
      <rect :class="diceClass" x="10" y="10" width="80" height="80" rx="10" />
      <circle
        v-for="(dot, i) in dotPositions(displayResult)"
        :key="i"
        :cx="dot.cx"
        :cy="dot.cy"
        r="5"
        fill="white"
      />
    </svg>
    <button class="putt-button" :class="{ locked: game.dice.locked }" @click="putt">
      Putt
    </button>
    <p v-if="game.noMoves" class="no-moves">No moves! Roll again.</p>
  </div>
</template>

<style scoped>
.dice-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0.5rem;
}

.dice {
  width: clamp(50px, 12vw, 100px);
  height: clamp(50px, 12vw, 100px);
  cursor: pointer;
  transition: transform 0.1s ease-in-out;
  -webkit-tap-highlight-color: transparent;
}

.dice.locked {
  cursor: not-allowed;
}

.dice:hover:not(.locked) {
  transform: scale(1.1);
}

.rolling {
  animation: roll 0.8s ease-in-out;
}

rect.D6 { fill: #161; stroke: #5a5a5a; stroke-width: 2; }
rect.D2 { fill: #fa3; stroke: #5a5a5a; stroke-width: 2; }
rect.D8 { fill: #3a3; stroke: #5a5a5a; stroke-width: 2; }

.dice.locked rect { fill: #5a5a5a; }

@keyframes roll {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(90deg) scale(0.9); }
  50%  { transform: rotate(180deg) scale(1.1); }
  75%  { transform: rotate(270deg) scale(0.9); }
  100% { transform: rotate(360deg) scale(1); }
}

.putt-button {
  margin-top: 5px;
  background-color: #88908a;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
  min-width: 80px;
  font-size: 0.9rem;
  -webkit-tap-highlight-color: transparent;
}

.putt-button.locked {
  cursor: not-allowed;
  background-color: #5a5a5a;
}

.putt-button:active:not(.locked) {
  background-color: #9aa09c;
}

.no-moves {
  color: #f77;
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 768px) {
  .dice-container {
    flex-direction: row;
    gap: 0.75rem;
    padding: 0.25rem;
  }
  .dice {
    width: 52px;
    height: 52px;
  }
  .putt-button {
    margin-top: 0;
    padding: 8px 14px;
    font-size: 0.9rem;
  }
  .no-moves {
    font-size: 0.75rem;
  }
}
</style>

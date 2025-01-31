<script lang="ts">
  import { Dice, Roll } from '$lib/dice.svelte';
  
  const { dice } = $props<{ dice: Dice }>();

  let diceResult = $state<number | null>(3);
  let isRolling = $state(false);
  // This will now properly react to store changes

  const diceClass = $derived(`D${dice.maxRoll}`);

  async function rolling() {
    if (dice.locked) return;
    isRolling = true;
    // Animate through different numbers before settling
    for (let i = 0; i < 10; i++) {
      diceResult = Math.floor(Math.random() * dice.maxRoll) + 1;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Final result
    diceResult = Math.floor(Math.random() * dice.maxRoll) + 1;
    dice.setLastRoll(new Roll(diceResult));
    isRolling = false;
    dice.locked = true;
  }

  async function putt() {
    if (dice.locked) return;
    dice.locked = true;
    diceResult = 1;
    dice.setLastRoll(new Roll(diceResult));
  }

  // SVG paths for dice faces 1-6
  const diceDots: { [key: number]: string } = {
    1: 'M50 50 h0',
    2: 'M35 35 h0 M65 65 h0',
    3: 'M35 35 h0 M50 50 h0 M65 65 h0',
    4: 'M35 35 h0 M35 65 h0 M65 35 h0 M65 65 h0',
    5: 'M35 35 h0 M35 65 h0 M50 50 h0 M65 35 h0 M65 65 h0',
    6: 'M35 35 h0 M35 50 h0 M35 65 h0 M65 35 h0 M65 50 h0 M65 65 h0',
    7: 'M35 35 h0 M35 50 h0 M35 65 h0 M50 50 h0 M65 35 h0 M65 50 h0 M65 65 h0',
    8: 'M35 35 h0 M35 50 h0 M35 65 h0 M50 35 h0 M50 65 h0 M65 35 h0 M65 50 h0 M65 65 h0'
  };
</script>

<div class="dice-container">
  <svg
    class="dice {isRolling ? 'rolling' : ''}"
    class:locked={dice.locked}
    width="100"
    height="100"
    viewBox="0 0 100 100"
    onclick={rolling}
    onkeydown={e => e.key === 'Enter' && rolling()}
    tabindex="0"
    role="button"
    aria-label="Roll dice"
  >
    <!-- Dice cube -->
    <rect class={diceClass} x="10" y="10" width="80" height="80" rx="10" />
    
    <!-- Dice dots -->
    {#if diceResult}
      <path
        d={diceDots[diceResult]}
        fill="white"
      />
      {#each diceDots[diceResult].split('M').filter(Boolean) as dot}
        <circle
          cx={dot.split(' ')[0]}
          cy={dot.split(' ')[1]}
          r="5"
          fill="white"
        />
      {/each}
    {/if}
  </svg>
  <button 
    class="putt-button" 
    class:locked={dice.locked}
    onclick={putt}
  >Putt</button>
</div>

<style>
  .dice-container {
    margin-top: 20px;
    text-align: center;
  }

  .dice {
    cursor: pointer;
    transition: transform 0.1s ease-in-out;
  }
  .dice.locked {
    cursor: not-allowed;
  }

  .dice:hover {
    transform: scale(1.1);
  }

  .rolling {
    animation: roll 0.8s ease-in-out;
  }

  rect.D6{
    fill: #161;
    stroke: #5a5a5a;
    stroke-width: 2;
  }

  rect.D2 {
    fill: #fa3;
    stroke: #5a5a5a;
    stroke-width: 2;
  }

  rect.D8 {
    fill: #3a3;
    stroke: #5a5a5a;
    stroke-width: 2;
  }

  .dice.locked rect {
    fill: #5a5a5a;
  }

  .dice.locked:hover {
    transform: none;
  }

  @keyframes roll {
    0% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(90deg) scale(0.9); }
    50% { transform: rotate(180deg) scale(1.1); }
    75% { transform: rotate(270deg) scale(0.9); }
    100% { transform: rotate(360deg) scale(1); }
  }

  .putt-button {
    margin-top: 10px;
    background-color: #88908a;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
  }
  .putt-button.locked {
    cursor: not-allowed;
    background-color: #5a5a5a;
  }

</style> 

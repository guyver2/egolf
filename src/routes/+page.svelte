<script lang="ts">
  import { Terrain } from '$lib/map';
  import Map from '$lib/components/Map.svelte';
  import Dice from '$lib/components/Dice.svelte';
  import HoleInfo from '$lib/components/HoleInfo.svelte';
  const width = 18;
  const height = 25;
  let seed = "not00set";
  let diceResult: number | null = null;
  let terrain = new Terrain(seed, width, height);
  
  function handleSeedChange(event: CustomEvent) {
    seed = event.detail.seed;
    terrain = new Terrain(seed, width, height);
  }

  function handleDiceRoll(event: CustomEvent) {
    diceResult = event.detail.result;
  }
</script>

<div class="game-container">
 <div class="left-column">
  <Dice on:diceRoll={handleDiceRoll} />
  <HoleInfo on:seedChange={handleSeedChange}/>
 </div>
 <div class="right-column">
  <Map {terrain} {diceResult} />
 </div>
</div>

<style>
  .game-container {
    padding-top: 10vh;
    padding-bottom: 10vh;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    background-color: #1a1a1a;
    gap: 20px;
  }

  .left-column {
    display: flex;
    flex-direction: column;
    width: 200px;
    justify-content: center;
    align-items: center;
    background-color: #272727;
    gap: 10px;
  }
  .right-column {
    align-items: center;
  }
</style>


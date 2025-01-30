<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<script>
  import { generateTerrain } from '$lib/map';
  import Map from '$lib/components/Map.svelte';
  const terrain = generateTerrain(18, 25);
</script>

<div class="game-container">
  <Map {terrain} />
</div>

<style>
  .game-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #1a1a1a;
  }
</style>


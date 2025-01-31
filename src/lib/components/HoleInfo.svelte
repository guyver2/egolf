<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Terrain } from '$lib/map';
    const dispatch = createEventDispatcher<{
        seedChange: { seed: string; }
    }>();
    export let terrain: Terrain;

    let seed = terrain.seed;  // Default 8-char value
    $: strokes = $terrain.ballPositionHistory.length;
    let distance = 0;
    let par = terrain.par;
    let editingSeed = false;

    function handleSeedSubmit() {
        // Ensure seed is 8 chars, alphanumeric only
        seed = seed.replace(/[^a-zA-Z0-9]/g, '0').slice(0, 8).padEnd(8, '0');
        editingSeed = false;
        dispatch('seedChange', { seed });
    }
</script>

<div class="hole-info-container">
    <p>Seed:
        {#if editingSeed}
            <input
                type="text"
                maxlength="8"
                pattern="[a-zA-Z0-9]+"
                bind:value={seed}
                on:blur={handleSeedSubmit}
                on:keydown={(e) => e.key === 'Enter' && handleSeedSubmit()}
                autofocus
            />
        {:else}
            <button 
                type="button" 
                on:click={() => editingSeed = true}
            >{seed.slice(0, 4)}-{seed.slice(4, 8)}</button>
        {/if}
    </p>
    <p><button on:click={() => {
        seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        handleSeedSubmit();
    }}>Random Seed!</button></p>
    <p>Par: {par}</p>
    <p>Strokes: {strokes}</p>
    <p>Distance: {distance}</p>
</div>

<style>
    .hole-info-container {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      margin-top: 20px;
      text-align: center;
      color: white;
      gap: 5px;
      padding-bottom: 20px;
    }
    input {
        background: transparent;
        border: 1px solid white;
        color: white;
        padding: 2px 4px;
        width: 60px;
    }
</style> 
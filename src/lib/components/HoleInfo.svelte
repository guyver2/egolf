<script lang="ts">
	import { Terrain } from '$lib/map.svelte';
	import { Dice } from '$lib/dice.svelte';
	const { terrain, dice } = $props<{ terrain: Terrain; dice: Dice }>();

	let seed = $state(terrain.seed); // Default 8-char value
	let strokes = $derived(terrain.ballPositionHistory.length);
	let distance = $derived(
		Math.abs(terrain.ballPosition[0] - terrain.holePosition[0]) +
			Math.abs(terrain.ballPosition[1] - terrain.holePosition[1])
	);
	let par = terrain.par;
	let editingSeed = $state(false);

	function handleSeedSubmit() {
		// Ensure seed is 8 chars, alphanumeric only
		seed = seed
			.replace(/[^a-zA-Z0-9]/g, '0')
			.slice(0, 8)
			.padEnd(8, '0');
		editingSeed = false;
		terrain.regenerate(seed, terrain.width, terrain.height);
		dice.reset(8);
	}
</script>

<div class="hole-info-container">
	<p>
		Seed:
		{#if editingSeed}
			<input
				type="text"
				maxlength="8"
				pattern="[a-zA-Z0-9]+"
				bind:value={seed}
				onblur={handleSeedSubmit}
				onkeydown={(e) => e.key === 'Enter' && handleSeedSubmit()}
			/>
		{:else}
			<button type="button" onclick={() => (editingSeed = true)}
				>{seed.slice(0, 4)}-{seed.slice(4, 8)}</button
			>
		{/if}
	</p>
	<p>
		<button
			class="seed-button"
			onclick={() => {
				seed =
					Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				handleSeedSubmit();
			}}>Random Map!</button
		>
	</p>
	<p>
		<button
			class="seed-button"
			onclick={() => {
				terrain.regenerate(terrain.seed, terrain.width, terrain.height);
				dice.reset(8);
			}}>Retry!</button
		>
	</p>
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

	.seed-button {
		margin-top: 10px;
		background-color: #99a29b;
		color: white;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
		border-radius: 5px;
	}
</style>

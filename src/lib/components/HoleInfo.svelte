<script lang="ts">
	import { Terrain } from '$lib/map.svelte';
	import { Dice } from '$lib/dice.svelte';
	import type { User } from "./$types";
	const { terrain, dice, user, showRandomButton=true, showSaveButton=true } = $props<{ 
		terrain: Terrain; 
		dice: Dice; 
		user: User | undefined; 
		showRandomButton?: boolean;
		showSaveButton?: boolean;
	}>();

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
	<div class="main-info">
		<p>Par: {par}</p>
		<p>Strokes: {strokes}</p>
		<p>Distance: {distance}</p>
	</div>
	<div class="seed-controls">
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
		<div class="button-group">
			{#if showRandomButton}
			<button
				class="seed-button"
				onclick={() => {
					seed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
					handleSeedSubmit();
				}}>
				Random
			</button>
			{/if}
			<button
				class="seed-button"
				onclick={() => {
					terrain.regenerate(terrain.seed, terrain.width, terrain.height);
					dice.reset(8);
				}}>
				Retry
			</button>
			{#if showSaveButton}
			<button
				class="seed-button"
				onclick={() => {
					const holeData = {
						name: "Random Hole " + Math.random().toString(36).substring(2, 15),
						seed: terrain.seed,
						width: terrain.width,
						height: terrain.height,
						authorId: user?.id
					};
					fetch('/api/holes', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(holeData)
					});
				}}>
				Save
			</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.hole-info-container {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		text-align: left;
		color: white;
		gap: 5px;
		padding: 0.5rem;
		min-width: 120px;
	}

	.main-info {
		display: flex;
		gap: 1rem;
	}

	.seed-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
	}

	input {
		background: transparent;
		border: 1px solid white;
		color: white;
		padding: 2px 4px;
		width: 80px;
		max-width: 100%;
	}

	.seed-button {
		background-color: #99a29b;
		color: white;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
		border-radius: 5px;
		font-size: 0.9rem;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.hole-info-container {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			gap: 1rem;
		}

		.main-info {
			font-size: 0.9rem;
		}

		.seed-controls {
			flex-direction: row;
			align-items: center;
		}

		p {
			margin: 0;
		}
	}

	/* Very small screens */
	@media (max-width: 480px) {
		.main-info {
			font-size: 0.8rem;
			gap: 0.5rem;
		}

		.seed-button {
			padding: 4px 8px;
			font-size: 0.8rem;
		}
	}
</style>

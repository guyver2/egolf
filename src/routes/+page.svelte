<script lang="ts">
	import { Terrain } from '$lib/map.svelte';
	import Map from '$lib/components/Map.svelte';
	import Club from '$lib/components/Club.svelte';
	import HoleInfo from '$lib/components/HoleInfo.svelte';
	import { Dice } from '$lib/dice.svelte';
	import { page } from '$app/state';

	const width = 18;
	const height = 25;
	// Get seed from URL path or use default
	$: seed = 'not00set';
	$: terrain = new Terrain(seed, width, height);
	const dice = new Dice(8);
</script>

<div class="game-container">
	<div class="content-wrapper">
		<div class="map-container">
			<Map {dice} {terrain} />
		</div>
		<div class="controls-container">
			<Club {dice} />
			<HoleInfo {terrain} {dice} />
		</div>
	</div>
</div>

<style>
	.game-container {
		min-height: 100vh;
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
	}

	.controls-container {
		display: flex;
		flex-direction: column;
		background-color: #272727;
		gap: 10px;
		padding: 1rem;
		border-radius: 8px;
		width: 200px;
	}

	.map-container {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	/* Responsive layout for screens smaller than 768px */
	@media (max-width: 768px) {
		.game-container {
			padding: 0;
			height: 100vh;
			overflow: hidden;
		}

		.content-wrapper {
			flex-direction: column;
			height: 100%;
			gap: 0;
			position: relative;
		}

		.map-container {
			flex: 1;
			overflow-y: auto;
			padding: 0.5rem;
			padding-bottom: 120px; /* Add space for fixed controls */
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
		}
	}

	/* Additional adjustments for very small screens */
	@media (max-width: 480px) {
		.controls-container {
			flex-direction: column;
			padding: 0.5rem;
		}
	}
</style>

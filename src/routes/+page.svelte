<script lang="ts">
	import { Terrain } from '$lib/map.svelte';
	import Map from '$lib/components/Map.svelte';
	import Club from '$lib/components/Club.svelte';
	import HoleInfo from '$lib/components/HoleInfo.svelte';
	import { Dice } from '$lib/dice.svelte';
	const width = 18;
	const height = 25;
	let seed = 'not00set';
	const terrain = new Terrain(seed, width, height);
	const dice = new Dice(8);
</script>

<div class="game-container">
	<div class="left-column">
		<Club {dice} />
		<HoleInfo {terrain} {dice} />
	</div>
	<div class="right-column">
		<Map {dice} {terrain} />
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

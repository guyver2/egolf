<script lang="ts">
	import { Terrain } from '$lib/map.svelte';
	import Map from '$lib/components/Map.svelte';
	import Club from '$lib/components/Club.svelte';
	import HoleInfo from '$lib/components/HoleInfo.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { Dice } from '$lib/dice.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { isLoggedIn, user, hole } = data;
	const width = hole.width;
	const height = hole.height;
	const seed = hole.seed;
	const terrain = $state(new Terrain(seed, width, height, hole.id));
	const dice = $state(new Dice(8));
	const showRandomButton = false;
	const showSaveButton = false;
	const allowSave = true;
	
</script>

<Navbar {isLoggedIn} {user} />

<div class="game-container">
	<div class="content-wrapper">
		<div class="map-container">
			<Map {dice} {terrain} {allowSave} {user} />
		</div>
		<div class="controls-container">
			<Club {dice} />
			<HoleInfo {terrain} {dice} {user} {showRandomButton} {showSaveButton}/>
		</div>
	</div>
</div>

<style>
	.game-container {
		margin-top: 60px; /* Add top margin equal to nav-bar height */
		min-height: calc(100vh - 60px);
		max-height: calc(100vh - 60px);
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
		max-height: 90vh;
		max-width: 50vw;
		overflow-y: auto;
	}

	/* Responsive layout for screens smaller than 768px */
	@media (max-width: 768px) {
		.game-container {
			padding: 0;
			height: calc(100vh - 60px);
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
			max-width: 100%; /* Remove 50vw limit on mobile */
			max-height: 85vh;
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

<script lang="ts">
	import { type TerrainSymbol, Terrain } from '$lib/map.svelte';
	import { Dice, Roll } from '$lib/dice.svelte';
	import type { User } from "$types";

	const { terrain, dice, allowSave=false, user } = $props<{
		terrain: Terrain;
		dice: Dice;
		allowSave?: boolean;
		user: User | undefined;
	}>();

	console.log("user", user);

	let roll: Roll | null = null;
	let landingPositions = $state<[number, number][]>([]);
	let ballPosition = $derived(terrain.ballPosition);
	let finished = $derived(
		ballPosition[0] === terrain.holePosition[0] && ballPosition[1] === terrain.holePosition[1]
	);
	let zoom = $state(20);

	$effect(() => {
		if (finished) {
			return;
		}
		if (dice.lastRoll !== null && roll?.timestamp !== dice.lastRoll?.timestamp) {
			landingPositions = terrain.getLandingPositions(dice.lastRoll.result);
			roll = new Roll(dice.lastRoll.result);
			roll.timestamp = dice.lastRoll.timestamp;
			// TODO: check if there are any valid landing positions
			// see this seed, first move is impossible: 30ke9qvw
		} else {
			landingPositions = [];
		}
	});

	$effect(() => {
		document.documentElement.style.setProperty('--terrain-height', terrain.height.toString());
		document.documentElement.style.setProperty('--terrain-width', terrain.width.toString());
	});

	// Map terrain types to colors
	const terrainColors: Record<TerrainSymbol, string> = {
		g: 'grass',
		w: 'water',
		s: 'sand',
		f: 'fairway',
		t: 'tree',
		u: 'up_arrow',
		d: 'down_arrow',
		l: 'left_arrow',
		r: 'right_arrow'
	};

	const backgroundColor = '#272727';

	// Function to determine corner rounding for each corner
	function getCornerRadii(row: number, col: number, currentTile: TerrainSymbol) {
		const corners = { tl: 0, tr: 0, bl: 0, br: 0 };
		const radius = 2;

		// Check all adjacent tiles (including diagonals)
		const hasTop = row > 0 && terrain.map[row - 1][col] === currentTile;
		const hasBottom = row < terrain.height - 1 && terrain.map[row + 1][col] === currentTile;
		const hasLeft = col > 0 && terrain.map[row][col - 1] === currentTile;
		const hasRight = col < terrain.width - 1 && terrain.map[row][col + 1] === currentTile;

		// Top-left corner
		if (!hasTop && !hasLeft) corners.tl = radius;
		// Top-right corner
		if (!hasTop && !hasRight) corners.tr = radius;
		// Bottom-left corner
		if (!hasBottom && !hasLeft) corners.bl = radius;
		// Bottom-right corner
		if (!hasBottom && !hasRight) corners.br = radius;

		return corners;
	}

	// Function to check if a position matches the current tile
	function isPositionAtTile(row: number, col: number, position: [number, number] | null): boolean {
		return position !== null && position[1] === row && position[0] === col;
	}

	function isLandingPosition(row: number, col: number): boolean {
		return landingPositions.some(([x, y]) => x === col && y === row);
	}

	function handleTileClick(row: number, col: number) {
		if (isLandingPosition(row, col) && dice.lastRoll !== null) {
			terrain.moveBall(dice.lastRoll.result, [col, row]);
			dice.locked = false;
			// Check if new position is on sand, update dice accordingly
			if (terrain.map[row][col] === 's') {
				dice.setMaxRoll(2);
			} else if (terrain.map[row][col] === 'f') {
				dice.setMaxRoll(8);
			} else {
				dice.setMaxRoll(6);
			}
			landingPositions = [];
			if (finished) {
				dice.locked = true;
			}
		}
	}

	async function saveHole() {
		console.log('saveHole');
		let strokes = terrain.ballPositionHistory
		strokes.push(terrain.ballPosition);
		const body = {
			holeId: terrain.id,
			userId: user?.id,
			strokes: strokes,
		};
		const holePlay = await fetch('/api/holeplays', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		}).then(res => res.json());
		console.log(holePlay);
	}
</script>

<div class="map-container">
	<svg
		class="map"
		class:finished
		viewBox={`0 0 ${terrain.width * 10} ${terrain.height * 10}`}
		preserveAspectRatio="xMidYMid meet"
		style="width: auto; height: auto;"
	>
		{#each terrain.map as row, rowIndex}
			{#each row as tile, colIndex}
				{@const corners = getCornerRadii(rowIndex, colIndex, tile as TerrainSymbol)}
				{@const isBall = isPositionAtTile(rowIndex, colIndex, ballPosition)}
				{@const isHole = isPositionAtTile(rowIndex, colIndex, terrain.holePosition)}
				{@const isStart = isPositionAtTile(rowIndex, colIndex, terrain.startPosition)}
				{@const isLanding = isLandingPosition(rowIndex, colIndex)}
				<g
					transform={`translate(${colIndex * 10} ${rowIndex * 10})`}
					class:tile={true}
					class:hole={isHole}
					class:start={isStart}
					class:landing={isLanding}
					class={terrainColors[tile as TerrainSymbol]}
					role="button"
					aria-label={`${isBall ? 'ball' : isHole ? 'hole' : isStart ? 'start' : terrainColors[tile as TerrainSymbol]} terrain`}
					onclick={() => handleTileClick(rowIndex, colIndex)}
					onkeydown={(e) => e.key === 'Enter' && handleTileClick(rowIndex, colIndex)}
					tabindex="0"
					focusable="true"
				>
					<rect x="0" y="0" width="10" height="10" fill={backgroundColor} />
					<path
						d={`
							M ${0.5 + corners.tl} 0.5
							H ${9.5 - corners.tr}
							A ${corners.tr} ${corners.tr} 0 0 1 9.5 ${0.5 + corners.tr}
							V ${9.5 - corners.br}
							A ${corners.br} ${corners.br} 0 0 1 ${9.5 - corners.br} 9.5
							H ${0.5 + corners.bl}
							A ${corners.bl} ${corners.bl} 0 0 1 0.5 ${9.5 - corners.bl}
							V ${0.5 + corners.tl}
							A ${corners.tl} ${corners.tl} 0 0 1 ${0.5 + corners.tl} 0.5
						`}
					/>
					{#if isBall}
						<circle cx="5" cy="5" r="2.5" class="ball" stroke="#666" stroke-width="0.5" />
					{/if}
				</g>
			{/each}
		{/each}
	</svg>
	{#if finished}
		<div class="overlay">
			<h1>Congratulations!</h1>
			{#if allowSave}
				<button onclick={saveHole}>Save Hole</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.map-container {
		position: relative;
		width: 70%;
		height: 100%;
		overflow: auto;
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		margin: 0 auto;
		border: 1px solid #ccc;
	}

	.map {
		display: flex;
		flex-direction: column;
		border: 2px solid #333;
		background-color: backgroundColor;
		padding: 10px;
		border-radius: 4px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
		margin: 0 auto;
	}

	.map.finished {
		filter: blur(3px);
	}

	.row {
		display: flex;
	}

	.tile {
		width: min(
			calc((100vh - 180px) / var(--terrain-height)),
			calc((100vw - 40px) / var(--terrain-width))
		);
		height: min(
			calc((100vh - 180px) / var(--terrain-height)),
			calc((100vw - 40px) / var(--terrain-width))
		);
		transition: transform 0.1s ease;
		/* transform-box: fill-box; */
        /* transform-origin: center; */
	}

	.tile.grass {
		fill: #161;
	}

	.tile.water {
		fill: #33f;
	}

	.tile.sand {
		fill: #fa3;
	}

	.tile.fairway {
		fill: #3a3;
	}

	.tile.tree {
		fill: #666;
	}

	.tile.start {
		fill: rgb(170, 51, 138);
	}

	.tile.hole {
		fill: #111;
	}

	.ball {
		fill: #d6d6d6;
	}

	/* .tile:hover {
		transform: scale(1.1);
		cursor: pointer;
	} */

	.tile:hover rect {
		fill: #f77;
	}
	.tile.landing rect {
		fill: #f77;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.3);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
		flex-direction: column;
	}

	.overlay h1 {
		color: #ffeaea;
		font-size: clamp(2em, 6vw, 4em);
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
		text-align: center;
		padding: 0 1rem;
	}

	.overlay button {
		background-color: #99a29b;
		color: white;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
		border-radius: 5px;
		font-size: 0.9rem;
	}

	@media (hover: none) {
		.tile:hover {
			transform: none;
		}

		.tile.landing {
			transform: scale(1.1);
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.tile {
			width: min(
				calc((100vh - 240px) / var(--terrain-height)),
				calc((100vw - 20px) / var(--terrain-width))
			);
			height: min(
				calc((100vh - 240px) / var(--terrain-height)),
				calc((100vw - 20px) / var(--terrain-width))
			);
		}

		.map-container {
			width: 100%;
		}
	}
</style>

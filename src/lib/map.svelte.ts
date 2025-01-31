/**
 * Symbol key:
 *   g = grass
 *   f = fairway
 *   s = sand
 *   t = tree
 *   w = water
 *   u, d, l, r = slopes (up, down, left, right)
 */

export type TerrainSymbol = 'g' | 'f' | 's' | 't' | 'w' | 'u' | 'd' | 'l' | 'r';

function inBounds(x: number, y: number, W: number, H: number) {
	return x >= 0 && x < W && y >= 0 && y < H;
}

export class Terrain {
	map = $state<TerrainSymbol[][]>([]);
	seed = $state('');
	ballPosition = $state<[number, number]>([0, 0]);
	ballPositionHistory = $state<[number, number][]>([]);
	holePosition = $state<[number, number]>([0, 0]);
	startPosition = $state<[number, number]>([0, 0]);
	width = $state(0);
	height = $state(0);
	par = $state(0);

	constructor(seed: string, width: number, height: number) {
		this.width = width;
		this.height = height;
		this.par = Math.floor(height / 5) + 1;
		this.map = generateTerrain(seed, width, height);
		this.seed = seed;
		this.ballPosition = this.findBallPosition();
		this.holePosition = this.findHolePosition();
		this.startPosition = this.ballPosition;
		this.ballPositionHistory = [];
		this.setNeighboursToFairway(this.ballPosition);
		this.setNeighboursToFairway(this.holePosition);
	}

	public regenerate(seed: string, width: number, height: number) {
		this.width = width;
		this.height = height;
		this.par = Math.floor(height / 5) + 1;
		this.map = generateTerrain(seed, width, height);
		this.seed = seed;
		this.ballPosition = this.findBallPosition();
		this.holePosition = this.findHolePosition();
		this.startPosition = this.ballPosition;
		this.ballPositionHistory = [];
		this.setNeighboursToFairway(this.ballPosition);
		this.setNeighboursToFairway(this.holePosition);
	}

	// Helper to set neighbours to fairway
	private setNeighboursToFairway(pos: [number, number]) {
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const x = pos[0] + dx;
				const y = pos[1] + dy;
				// Skip if out of bounds or is the center tile
				if (x >= 0 && x < this.width && y >= 0 && y < this.height && !(dx === 0 && dy === 0)) {
					this.map[y][x] = 'f';
				}
			}
		}
	}

	private findBallPosition(): [number, number] {
		let ballPlaced = false;
		for (let attempts = 0; attempts < 100 && !ballPlaced; attempts++) {
			const startX = randInt(0, this.width - 1);
			for (let y = this.height - 1; y >= Math.floor((3 * this.height) / 4); y--) {
				if (this.map[y][startX] === 'f') {
					//this.map[y][startX] = 'b';
					ballPlaced = true;
					this.ballPosition = [startX, y];
					break;
				}
			}
		}
		if (!ballPlaced) {
			// Fallback: if we never found a fairway in bottom quarter,
			// just place ball in bottom-left corner forcibly
			//this.map[this.height - 2][1] = 'b';
			this.ballPosition = [1, this.height - 2];
		}
		return this.ballPosition;
	}

	private findHolePosition(): [number, number] {
		let holePlaced = false;
		for (let attempts = 0; attempts < 100 && !holePlaced; attempts++) {
			const startX = randInt(0, this.width - 1);
			for (let y = 0; y < Math.floor(this.height / 4); y++) {
				if (this.map[y][startX] === 'f') {
					//this.map[y][startX] = 'h';
					holePlaced = true;
					this.holePosition = [startX, y];
					break;
				}
			}
		}
		if (!holePlaced) {
			// Fallback: if we never found a fairway in top quarter,
			// just place hole in top-right corner forcibly
			//this.map[1][this.width - 2] = 'h';
			this.holePosition = [this.width - 2, 1];
		}
		return this.holePosition;
	}

	public getLandingPositions(roll: number): [number, number][] {
		const directions = [
			[-1, -1],
			[0, -1],
			[1, -1], // NW, N, NE
			[-1, 0],
			[1, 0], // W, E
			[-1, 1],
			[0, 1],
			[1, 1] // SW, S, SE
		];

		const validPositions: [number, number][] = [];
		const [startX, startY] = this.ballPosition;

		for (const [dx, dy] of directions) {
			// Calculate target position
			const targetX = startX + dx * roll;
			const targetY = startY + dy * roll;

			// Check if position is in bounds
			if (targetX >= 0 && targetX < this.width && targetY >= 0 && targetY < this.height) {
				// Check if target position is not a tree or water
				const terrain = this.map[targetY][targetX];
				if (terrain !== 't' && terrain !== 'w') {
					validPositions.push([targetX, targetY]);
				}
			}
		}
		return validPositions;
	}

	public moveBall(roll: number, position: [number, number]) {
		if (this.getLandingPositions(roll).some(([x, y]) => x === position[0] && y === position[1])) {
			this.ballPositionHistory.push(this.ballPosition);
			this.ballPosition = position;
		} else {
			console.log(`Invalid move to ${position}, not in ${this.getLandingPositions(roll)}`);
		}
	}
}

// Convenience helpers
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function erode(terrain: TerrainSymbol[][], type: TerrainSymbol): TerrainSymbol[][] {
	const H = terrain.length;
	const W = terrain[0].length;
	const tempTerrain = terrain.map((row) => [...row]);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (terrain[y][x] === type) {
				// Check if this tile has fewer than 2 neighbors of the same type
				let neighbors = 0;
				for (const [dx, dy] of [
					[0, 1],
					[0, -1],
					[1, 0],
					[-1, 0],
					[1, 1],
					[1, -1],
					[-1, 1],
					[-1, -1]
				]) {
					const nx = x + dx,
						ny = y + dy;
					if (inBounds(nx, ny, W, H) && terrain[ny][nx] === type) neighbors++;
				}
				if (neighbors < 8) {
					tempTerrain[y][x] = 'g';
				}
			}
		}
	}
	return tempTerrain;
}

function dilate(terrain: TerrainSymbol[][], type: TerrainSymbol): TerrainSymbol[][] {
	const H = terrain.length;
	const W = terrain[0].length;
	const tempTerrain = terrain.map((row) => [...row]);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			if (terrain[y][x] === type) {
				for (const [dx, dy] of [
					[0, 1],
					[0, -1],
					[1, 0],
					[-1, 0],
					[1, 1],
					[1, -1],
					[-1, 1],
					[-1, -1]
				]) {
					const nx = x + dx,
						ny = y + dy;
					if (inBounds(nx, ny, W, H)) {
						tempTerrain[ny][nx] = type;
					}
				}
			}
		}
	}
	return tempTerrain;
}

/**
 * Randomly "paints" a blob of tiles of a given type around a center (cx, cy).
 * `size` controls how many tiles it will attempt to paint.
 */
function paintBlob(
	terrain: TerrainSymbol[][],
	cx: number,
	cy: number,
	size: number,
	type: Exclude<TerrainSymbol, 'b' | 'h'>
): TerrainSymbol[][] {
	const H = terrain.length;
	const W = terrain[0].length;
	const stack = [[cx, cy]];
	let count = 0;
	while (stack.length > 0 && count < size) {
		const [x, y] = stack.pop()!;
		if (inBounds(x, y, W, H)) {
			terrain[y][x] = type;
			count++;
			if (Math.random() < 0.7) stack.push([x + 1, y]);
			if (Math.random() < 0.7) stack.push([x - 1, y]);
			if (Math.random() < 0.7) stack.push([x, y + 1]);
			if (Math.random() < 0.7) stack.push([x, y - 1]);
			if (type === 't') {
				if (Math.random() < 0.4) stack.push([x + 1, y + 1]);
				if (Math.random() < 0.4) stack.push([x - 1, y + 1]);
				if (Math.random() < 0.4) stack.push([x + 1, y - 1]);
				if (Math.random() < 0.4) stack.push([x - 1, y - 1]);
			}
			// Randomize the order of items in the stack to create more organic shapes
			for (let i = stack.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[stack[i], stack[j]] = [stack[j], stack[i]];
			}
			// Remove duplicates from stack by converting to Set and back
			const uniquePoints = new Set(stack.map((point) => point.join(',')));
			stack.length = 0; // Clear the stack
			stack.push(...Array.from(uniquePoints).map((point) => point.split(',').map(Number)));
		}
	}

	// Morphological operations to clean up the shape
	// First do opening (erosion then dilation) to remove small isolated pieces
	// Then do closing (dilation then erosion) to fill small holes
	//terrain = erode(terrain, type);
	if (type != 't') {
		terrain = dilate(terrain, type);
		terrain = erode(terrain, type);
	}
	return terrain;
}

function stringToUniqueNumber(str: string): number {
	let hash = 0;
	if (str.length === 0) return hash;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char; // dummy hashing algorithm
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash); // Ensure a positive number
}

/**
 * Returns a 2D array (height H, width W) of TerrainSymbol
 */
export function generateTerrain(seed: string, W: number, H: number): TerrainSymbol[][] {
	// Set random seed for deterministic generation
	Math.random = (() => {
		let numSeed = stringToUniqueNumber(seed);
		return () => {
			numSeed = (numSeed * 16807) % 2147483647;
			return (numSeed - 1) / 2147483646;
		};
	})();

	// 1) Create a 2D array filled with 'g' (grass) by default
	let terrain: TerrainSymbol[][] = [];
	for (let y = 0; y < H; y++) {
		terrain[y] = [];
		for (let x = 0; x < W; x++) {
			terrain[y][x] = 'g';
		}
	}

	// 2) Paint a few random fairway "blobs". We'll ensure top and bottom each get at least one.
	//    Start with top quarter:
	for (let i = 0; i < 1; i++) {
		const x = randInt(0, W - 1);
		const y = randInt(0, Math.floor(H / 4)); // top quarter
		terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f');
	}
	//    Then middle part:
	for (let i = 0; i < 4; i++) {
		const x = randInt(0, W - 1);
		const y = randInt(Math.floor(H / 4), Math.floor((3 * H) / 4));
		terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f');
	}
	//    And bottom quarter:
	for (let i = 0; i < 2; i++) {
		const x = randInt(0, W - 1);
		const y = randInt(Math.floor((3 * H) / 4), H - 1);
		terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f');
	}

	// 3) Randomly paint some sand, trees, or water over the rough, for variety
	for (let i = 0; i < 7; i++) {
		const x = randInt(0, W - 1);
		const y = randInt(0, H - 1);
		const r = Math.random();
		const terrainType: TerrainSymbol = r < 0.33 ? 's' : r < 0.66 ? 't' : 'w';
		terrain = paintBlob(terrain, x, y, randInt(10, 20), terrainType);
	}

	return terrain;
}

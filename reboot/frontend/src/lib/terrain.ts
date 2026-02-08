/**
 * Terrain generation ported from the Svelte version.
 * Symbol key:
 *   g = grass
 *   f = fairway
 *   s = sand
 *   t = tree
 *   w = water
 */

export type TerrainSymbol = 'g' | 'f' | 's' | 't' | 'w'

function inBounds(x: number, y: number, W: number, H: number): boolean {
  return x >= 0 && x < W && y >= 0 && y < H
}

// Seeded PRNG (LCG) — replaces Math.random for deterministic generation
function createSeededRandom(seed: string): () => number {
  let numSeed = stringToUniqueNumber(seed)
  return () => {
    numSeed = (numSeed * 16807) % 2147483647
    return (numSeed - 1) / 2147483646
  }
}

function stringToUniqueNumber(str: string): number {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash) || 1
}

function erode(
  terrain: TerrainSymbol[][],
  type: TerrainSymbol,
  W: number,
  H: number
): TerrainSymbol[][] {
  const temp = terrain.map((row) => [...row])
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (terrain[y][x] === type) {
        let neighbors = 0
        for (const [dx, dy] of [
          [0, 1], [0, -1], [1, 0], [-1, 0],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]) {
          const nx = x + dx, ny = y + dy
          if (inBounds(nx, ny, W, H) && terrain[ny][nx] === type) neighbors++
        }
        if (neighbors < 8) {
          temp[y][x] = 'g'
        }
      }
    }
  }
  return temp
}

function dilate(
  terrain: TerrainSymbol[][],
  type: TerrainSymbol,
  W: number,
  H: number
): TerrainSymbol[][] {
  const temp = terrain.map((row) => [...row])
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (terrain[y][x] === type) {
        for (const [dx, dy] of [
          [0, 1], [0, -1], [1, 0], [-1, 0],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]) {
          const nx = x + dx, ny = y + dy
          if (inBounds(nx, ny, W, H)) {
            temp[ny][nx] = type
          }
        }
      }
    }
  }
  return temp
}

function paintBlob(
  terrain: TerrainSymbol[][],
  cx: number,
  cy: number,
  size: number,
  type: TerrainSymbol,
  random: () => number,
  W: number,
  H: number
): TerrainSymbol[][] {
  const stack: number[][] = [[cx, cy]]
  let count = 0
  while (stack.length > 0 && count < size) {
    const [x, y] = stack.pop()!
    if (inBounds(x, y, W, H)) {
      terrain[y][x] = type
      count++
      if (random() < 0.7) stack.push([x + 1, y])
      if (random() < 0.7) stack.push([x - 1, y])
      if (random() < 0.7) stack.push([x, y + 1])
      if (random() < 0.7) stack.push([x, y - 1])
      if (type === 't') {
        if (random() < 0.4) stack.push([x + 1, y + 1])
        if (random() < 0.4) stack.push([x - 1, y + 1])
        if (random() < 0.4) stack.push([x + 1, y - 1])
        if (random() < 0.4) stack.push([x - 1, y - 1])
      }
      // Shuffle stack for organic shapes
      for (let i = stack.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[stack[i], stack[j]] = [stack[j], stack[i]]
      }
      // Remove duplicates
      const unique = new Set(stack.map((p) => p.join(',')))
      stack.length = 0
      stack.push(...Array.from(unique).map((p) => p.split(',').map(Number)))
    }
  }

  // Morphological cleanup (skip for trees)
  if (type !== 't') {
    terrain = dilate(terrain, type, W, H)
    terrain = erode(terrain, type, W, H)
  }
  return terrain
}

export function generateTerrain(
  seed: string,
  W: number,
  H: number
): TerrainSymbol[][] {
  const random = createSeededRandom(seed)
  const randInt = (min: number, max: number) =>
    Math.floor(random() * (max - min + 1)) + min

  // Fill with grass
  let terrain: TerrainSymbol[][] = []
  for (let y = 0; y < H; y++) {
    terrain[y] = []
    for (let x = 0; x < W; x++) {
      terrain[y][x] = 'g'
    }
  }

  // Fairway blobs — top quarter
  for (let i = 0; i < 1; i++) {
    const x = randInt(0, W - 1)
    const y = randInt(0, Math.floor(H / 4))
    terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f', random, W, H)
  }
  // Middle
  for (let i = 0; i < Math.floor(H / 6); i++) {
    const x = randInt(0, W - 1)
    const y = randInt(Math.floor(H / 4), Math.floor((3 * H) / 4))
    terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f', random, W, H)
  }
  // Bottom quarter
  for (let i = 0; i < 2; i++) {
    const x = randInt(0, W - 1)
    const y = randInt(Math.floor((3 * H) / 4), H - 1)
    terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f', random, W, H)
  }

  // Scatter sand, trees, water
  for (let i = 0; i < Math.floor(H / 2); i++) {
    const x = randInt(0, W - 1)
    const y = randInt(0, H - 1)
    const r = random()
    const terrainType: TerrainSymbol = r < 0.33 ? 's' : r < 0.66 ? 't' : 'w'
    terrain = paintBlob(terrain, x, y, randInt(10, 20), terrainType, random, W, H)
  }

  return terrain
}

export class Terrain {
  id: number
  map: TerrainSymbol[][]
  seed: string
  width: number
  height: number
  par: number
  ballPosition: [number, number]
  ballPositionHistory: [number, number][]
  holePosition: [number, number]
  startPosition: [number, number]

  /** @internal */ _random: () => number = () => 0
  /** @internal */ _randInt: (min: number, max: number) => number = () => 0

  constructor(seed: string, width: number, height: number, id: number = -1) {
    this.id = id
    this.seed = seed
    this.width = width
    this.height = height
    this.par = Math.floor(height / 5) + 1
    this.map = generateTerrain(seed, width, height)
    this.ballPositionHistory = []

    this._random = createSeededRandom(seed + '_placement')
    this._randInt = (min, max) =>
      Math.floor(this._random() * (max - min + 1)) + min

    this.ballPosition = this._findBallPosition()
    this.holePosition = this._findHolePosition()
    this.startPosition = [...this.ballPosition]
    this._setNeighboursToFairway(this.ballPosition)
    this._setNeighboursToFairway(this.holePosition)
  }

  regenerate(seed: string, width: number, height: number): void {
    this.seed = seed
    this.width = width
    this.height = height
    this.par = Math.floor(height / 5) + 1
    this.map = generateTerrain(seed, width, height)
    this.ballPositionHistory = []

    this._random = createSeededRandom(seed + '_placement')
    this._randInt = (min, max) =>
      Math.floor(this._random() * (max - min + 1)) + min

    this.ballPosition = this._findBallPosition()
    this.holePosition = this._findHolePosition()
    this.startPosition = [...this.ballPosition]
    this._setNeighboursToFairway(this.ballPosition)
    this._setNeighboursToFairway(this.holePosition)
  }

  _setNeighboursToFairway(pos: [number, number]): void {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = pos[0] + dx
        const y = pos[1] + dy
        if (
          x >= 0 && x < this.width &&
          y >= 0 && y < this.height &&
          !(dx === 0 && dy === 0)
        ) {
          this.map[y][x] = 'f'
        }
      }
    }
  }

  _findBallPosition(): [number, number] {
    for (let attempts = 0; attempts < 100; attempts++) {
      const startX = this._randInt(0, this.width - 1)
      for (let y = this.height - 1; y >= Math.floor(0.9 * this.height); y--) {
        if (this.map[y][startX] === 'f') {
          this.ballPosition = [startX, y]
          return this.ballPosition
        }
      }
    }
    this.ballPosition = [1, this.height - 2]
    return this.ballPosition
  }

  _findHolePosition(): [number, number] {
    for (let attempts = 0; attempts < 100; attempts++) {
      const startX = this._randInt(0, this.width - 1)
      for (let y = 0; y < Math.floor(this.height / 10); y++) {
        if (this.map[y][startX] === 'f') {
          this.holePosition = [startX, y]
          return this.holePosition
        }
      }
    }
    this.holePosition = [this.width - 2, 1]
    return this.holePosition
  }

  getLandingPositions(roll: number): [number, number][] {
    const directions = [
      [-0.707, -0.707], [0, -1], [0.707, -0.707],
      [-1, 0], [1, 0],
      [-0.707, 0.707], [0, 1], [0.707, 0.707]
    ]
    const valid: [number, number][] = []
    const [startX, startY] = this.ballPosition

    for (const [dx, dy] of directions) {
      const offsetX = dx > 0 ? Math.ceil(dx * roll) : Math.floor(dx * roll)
      const offsetY = dy > 0 ? Math.ceil(dy * roll) : Math.floor(dy * roll)
      const targetX = startX + offsetX
      const targetY = startY + offsetY

      if (
        targetX >= 0 && targetX < this.width &&
        targetY >= 0 && targetY < this.height
      ) {
        const t = this.map[targetY][targetX]
        if (t !== 't' && t !== 'w') {
          valid.push([targetX, targetY])
        }
      }
    }
    return valid
  }

  moveBall(roll: number, position: [number, number]): boolean {
    const valid = this.getLandingPositions(roll)
    if (valid.some(([x, y]) => x === position[0] && y === position[1])) {
      this.ballPositionHistory.push([...this.ballPosition])
      this.ballPosition = position
      return true
    }
    return false
  }

  get finished(): boolean {
    return (
      this.ballPosition[0] === this.holePosition[0] &&
      this.ballPosition[1] === this.holePosition[1]
    )
  }

  get strokes(): number {
    return this.ballPositionHistory.length
  }

  get distance(): number {
    return (
      Math.abs(this.ballPosition[0] - this.holePosition[0]) +
      Math.abs(this.ballPosition[1] - this.holePosition[1])
    )
  }
}

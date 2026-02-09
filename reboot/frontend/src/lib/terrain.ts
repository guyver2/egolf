/**
 * Terrain class — receives map data from the backend API.
 *
 * Symbol key:
 *   g = grass
 *   f = fairway
 *   s = sand
 *   t = tree
 *   w = water
 */

export type TerrainSymbol = 'g' | 'f' | 's' | 't' | 'w'

/** Shape of the response from GET /api/terrain/generate */
export interface TerrainData {
  map: TerrainSymbol[][]
  ball_position: [number, number]
  hole_position: [number, number]
  start_position: [number, number]
  par: number
  seed: string
  width: number
  height: number
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

  constructor(data: TerrainData, id: number = -1) {
    this.id = id
    this.seed = data.seed
    this.width = data.width
    this.height = data.height
    this.par = data.par
    this.map = data.map
    this.ballPosition = data.ball_position
    this.holePosition = data.hole_position
    this.startPosition = data.start_position
    this.ballPositionHistory = []
  }

  /** Reset the terrain with new server data */
  loadData(data: TerrainData): void {
    this.seed = data.seed
    this.width = data.width
    this.height = data.height
    this.par = data.par
    this.map = data.map
    this.ballPosition = data.ball_position
    this.holePosition = data.hole_position
    this.startPosition = data.start_position
    this.ballPositionHistory = []
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

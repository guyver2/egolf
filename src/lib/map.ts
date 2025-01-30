/**
 * Symbol key:
 *   g = grass
 *   f = fairway
 *   s = sand
 *   t = tree
 *   w = water
 *   u, d, l, r = slopes (up, down, left, right)
 *   b = ball (start) – placed on a fairway tile in bottom quarter
 *   h = hole (end) – placed on a fairway tile in top quarter
 */

export type TerrainSymbol = 'g' | 'f' | 's' | 't' | 'w' | 'u' | 'd' | 'l' | 'r' | 'b' | 'h';


function inBounds(x: number, y: number, W: number, H: number) {
  return x >= 0 && x < W && y >= 0 && y < H;
}

// Convenience helpers
const randInt = (min: number, max: number) => 
    Math.floor(Math.random() * (max - min + 1)) + min;

function erode(terrain: TerrainSymbol[][], type: TerrainSymbol): TerrainSymbol[][] {
    const H = terrain.length;
    const W = terrain[0].length;
    const tempTerrain = terrain.map(row => [...row]);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (terrain[y][x] === type) {
          // Check if this tile has fewer than 2 neighbors of the same type
          let neighbors = 0;
          for (const [dx, dy] of [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]) {
            const nx = x + dx, ny = y + dy;
            if (inBounds(nx, ny, W, H) && terrain[ny][nx] === type) neighbors++;
          }
          if (neighbors < 8) {
              console.log(`Eroding ${x},${y}`);
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
    const tempTerrain = terrain.map(row => [...row]);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (terrain[y][x] === type) {
          for (const [dx, dy] of [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]) {
            const nx = x + dx, ny = y + dy;
            if (inBounds(nx, ny, W, H)) {
             console.log(`Dilating ${nx},${ny}`);
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
  function paintBlob(terrain: TerrainSymbol[][], cx: number, cy: number, size: number, type: Exclude<TerrainSymbol, 'b'|'h'>) : TerrainSymbol[][] {
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
        // if (Math.random() < 0.4) stack.push([x + 1, y + 1]);
        // if (Math.random() < 0.4) stack.push([x - 1, y + 1]);
        // if (Math.random() < 0.4) stack.push([x + 1, y - 1]);
        // if (Math.random() < 0.4) stack.push([x - 1, y - 1]);
        // Randomize the order of items in the stack to create more organic shapes
        for (let i = stack.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [stack[i], stack[j]] = [stack[j], stack[i]];
        }
        // Remove duplicates from stack by converting to Set and back
        const uniquePoints = new Set(stack.map(point => point.join(',')));
        stack.length = 0;  // Clear the stack
        stack.push(...Array.from(uniquePoints).map(point => point.split(',').map(Number)));
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


/**
 * Returns a 2D array (height H, width W) of TerrainSymbol
 */
export function generateTerrain(W: number, H: number): TerrainSymbol[][] {
    // Set random seed for deterministic generation
    // Math.random = (() => {
    //     let seed = 12346; // Fixed seed for consistent results
    //     return () => {
    //         seed = (seed * 16807) % 2147483647;
    //         return (seed - 1) / 2147483646;
    //     };
    // })();
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
    const y = randInt(Math.floor(H/4), Math.floor(3*H/4));
    terrain = paintBlob(terrain, x, y, randInt(10, 30), 'f');
  }
  //    And bottom quarter:
  for (let i = 0; i < 2; i++) {
    const x = randInt(0, W - 1);
    const y = randInt(Math.floor(3*H/4), H - 1);
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

//   // 4) Add a handful of slope tiles on top of rough or fairway.
//   //    We'll just randomly pick directions.
//   const slopeSymbols: TerrainSymbol[] = ['u', 'd', 'l', 'r'];
//   for (let i = 0; i < 6; i++) {
//     const x = randInt(0, W - 1);
//     const y = randInt(0, H - 1);
//     // Make sure not to overwrite trees or sand so often
//     if (terrain[y][x] === 'g' || terrain[y][x] === 'f') {
//       terrain[y][x] = slopeSymbols[randInt(0, slopeSymbols.length - 1)];
//     }
//   }

  // 5) Place the ball (b) in the bottom quarter, on a fairway tile.
  //    We'll search downward from some random X until we find an 'f'.
  let ballPlaced = false;
  for (let attempts = 0; attempts < 100 && !ballPlaced; attempts++) {
    const startX = randInt(0, W - 1);
    for (let y = H - 1; y >= Math.floor(3*H/4); y--) {
      if (terrain[y][startX] === 'f') {
        terrain[y][startX] = 'b';
        ballPlaced = true;
        break;
      }
    }
  }
  if (!ballPlaced) {
    // Fallback: if we never found a fairway in bottom quarter,
    // just place ball in bottom-left corner forcibly
    terrain[H - 1][0] = 'b';
  }

  // 6) Place the hole (h) in the top quarter, on a fairway tile.
  let holePlaced = false;
  for (let attempts = 0; attempts < 100 && !holePlaced; attempts++) {
    const startX = randInt(0, W - 1);
    for (let y = 0; y < Math.floor(H/4); y++) {
      if (terrain[y][startX] === 'f') {
        terrain[y][startX] = 'h';
        holePlaced = true;
        break;
      }
    }
  }
  if (!holePlaced) {
    // Fallback: if we never found a fairway in top quarter,
    // just place hole in top-left
    terrain[0][0] = 'h';
  }

  // 7) Ensure the 8 neighbours around ball and hole are fairway
  //    First find ball and hole positions
  let ballX = -1, ballY = -1, holeX = -1, holeY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (terrain[y][x] === 'b') {
        ballX = x;
        ballY = y;
      } else if (terrain[y][x] === 'h') {
        holeX = x;
        holeY = y;
      }
    }
  }

  // Helper to set neighbours to fairway
  const setNeighboursToFairway = (centerX: number, centerY: number) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        // Skip if out of bounds or is the center tile
        if (x >= 0 && x < W && y >= 0 && y < H && !(dx === 0 && dy === 0)) {
          terrain[y][x] = 'f';
        }
      }
    }
  };

  // Set neighbours for both ball and hole
  setNeighboursToFairway(ballX, ballY);
  setNeighboursToFairway(holeX, holeY);

  return terrain;
}


use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};

use crate::models::TerrainData;

type Tile = char;

const NEIGHBORS: [(i32, i32); 8] = [
    (0, 1),
    (0, -1),
    (1, 0),
    (-1, 0),
    (1, 1),
    (1, -1),
    (-1, 1),
    (-1, -1),
];

fn in_bounds(x: i32, y: i32, w: i32, h: i32) -> bool {
    (0..w).contains(&x) && (0..h).contains(&y)
}

fn erode(terrain: &mut Vec<Vec<Tile>>, tile_type: Tile, w: i32, h: i32) {
    let mut temp = terrain.clone();
    for y in 0..h {
        for x in 0..w {
            if terrain[y as usize][x as usize] == tile_type {
                let neighbors = NEIGHBORS
                    .iter()
                    .filter(|(dx, dy)| {
                        let nx = x + dx;
                        let ny = y + dy;
                        in_bounds(nx, ny, w, h)
                            && terrain[ny as usize][nx as usize] == tile_type
                    })
                    .count();
                if neighbors < 8 {
                    temp[y as usize][x as usize] = 'g';
                }
            }
        }
    }
    *terrain = temp;
}

fn dilate(terrain: &mut Vec<Vec<Tile>>, tile_type: Tile, w: i32, h: i32) {
    let mut temp = terrain.clone();
    for y in 0..h {
        for x in 0..w {
            if terrain[y as usize][x as usize] == tile_type {
                for (dx, dy) in NEIGHBORS {
                    let nx = x + dx;
                    let ny = y + dy;
                    if in_bounds(nx, ny, w, h) {
                        temp[ny as usize][nx as usize] = tile_type;
                    }
                }
            }
        }
    }
    *terrain = temp;
}

fn paint_blob(
    terrain: &mut Vec<Vec<Tile>>,
    cx: i32,
    cy: i32,
    size: i32,
    tile_type: Tile,
    rng: &mut StdRng,
    w: i32,
    h: i32,
) {
    let mut stack = vec![(cx, cy)];
    let mut count = 0;
    while let Some((x, y)) = stack.pop() {
        if !in_bounds(x, y, w, h) || count >= size {
            continue;
        }
        terrain[y as usize][x as usize] = tile_type;
        count += 1;
        if rng.random_bool(0.7) {
            stack.push((x + 1, y));
        }
        if rng.random_bool(0.7) {
            stack.push((x - 1, y));
        }
        if rng.random_bool(0.7) {
            stack.push((x, y + 1));
        }
        if rng.random_bool(0.7) {
            stack.push((x, y - 1));
        }
        if tile_type == 't' {
            if rng.random_bool(0.4) {
                stack.push((x + 1, y + 1));
            }
            if rng.random_bool(0.4) {
                stack.push((x - 1, y + 1));
            }
            if rng.random_bool(0.4) {
                stack.push((x + 1, y - 1));
            }
            if rng.random_bool(0.4) {
                stack.push((x - 1, y - 1));
            }
        }
        stack.sort_unstable();
        stack.dedup();
    }

    if tile_type != 't' {
        dilate(terrain, tile_type, w, h);
        erode(terrain, tile_type, w, h);
    }
}

fn seed_rng(seed: &str) -> StdRng {
    let mut hash: u64 = 0;
    for b in seed.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(b as u64);
    }
    StdRng::seed_from_u64(hash)
}

fn generate_terrain(seed: &str, w: i32, h: i32) -> (Vec<Vec<Tile>>, StdRng) {
    let mut rng = seed_rng(seed);
    let mut terrain = vec![vec!['g'; w as usize]; h as usize];

    for _ in 0..1 {
        let x = rng.random_range(0..w);
        let y = rng.random_range(0..h / 4);
        paint_blob(
            &mut terrain,
            x,
            y,
            rng.random_range(10..=30),
            'f',
            &mut rng,
            w,
            h,
        );
    }

    for _ in 0..(h / 6) {
        let x = rng.random_range(0..w);
        let y = rng.random_range(h / 4..(3 * h) / 4);
        paint_blob(
            &mut terrain,
            x,
            y,
            rng.random_range(10..=30),
            'f',
            &mut rng,
            w,
            h,
        );
    }

    for _ in 0..2 {
        let x = rng.random_range(0..w);
        let y = rng.random_range((3 * h) / 4..h);
        paint_blob(
            &mut terrain,
            x,
            y,
            rng.random_range(10..=30),
            'f',
            &mut rng,
            w,
            h,
        );
    }

    for _ in 0..(h / 2) {
        let x = rng.random_range(0..w);
        let y = rng.random_range(0..h);
        let r: f64 = rng.random();
        let t = if r < 0.33 {
            's'
        } else if r < 0.66 {
            't'
        } else {
            'w'
        };
        paint_blob(
            &mut terrain,
            x,
            y,
            rng.random_range(10..=20),
            t,
            &mut rng,
            w,
            h,
        );
    }

    (terrain, rng)
}

fn set_neighbours_to_fairway(terrain: &mut Vec<Vec<Tile>>, pos: (i32, i32), w: i32, h: i32) {
    let (px, py) = pos;
    for dy in -1..=1 {
        for dx in -1..=1 {
            if dx == 0 && dy == 0 {
                continue;
            }
            let x = px + dx;
            let y = py + dy;
            if in_bounds(x, y, w, h) {
                terrain[y as usize][x as usize] = 'f';
            }
        }
    }
}

fn find_ball_position(terrain: &[Vec<Tile>], w: i32, h: i32, rng: &mut StdRng) -> (i32, i32) {
    for _ in 0..100 {
        let start_x = rng.random_range(0..w);
        let min_y = ((0.9 * h as f64) as i32).max(0);
        for y in (min_y..h).rev() {
            if terrain[y as usize][start_x as usize] == 'f' {
                return (start_x, y);
            }
        }
    }
    (1, h - 2)
}

fn find_hole_position(terrain: &[Vec<Tile>], w: i32, h: i32, rng: &mut StdRng) -> (i32, i32) {
    for _ in 0..100 {
        let start_x = rng.random_range(0..w);
        for y in 0..(h / 10) {
            if terrain[y as usize][start_x as usize] == 'f' {
                return (start_x, y);
            }
        }
    }
    (w - 2, 1)
}

pub fn generate_full_terrain(seed: &str, w: i32, h: i32) -> TerrainData {
    let (mut terrain, mut rng) = generate_terrain(seed, w, h);
    let ball_pos = find_ball_position(&terrain, w, h, &mut rng);
    let hole_pos = find_hole_position(&terrain, w, h, &mut rng);

    set_neighbours_to_fairway(&mut terrain, ball_pos, w, h);
    set_neighbours_to_fairway(&mut terrain, hole_pos, w, h);
    terrain[ball_pos.1 as usize][ball_pos.0 as usize] = 'f';
    terrain[hole_pos.1 as usize][hole_pos.0 as usize] = 'f';

    TerrainData {
        map: terrain,
        ball_position: [ball_pos.0, ball_pos.1],
        hole_position: [hole_pos.0, hole_pos.1],
        start_position: [ball_pos.0, ball_pos.1],
        par: h / 5 + 1,
        seed: seed.to_string(),
        width: w,
        height: h,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn terrain_is_deterministic() {
        let a = generate_full_terrain("abc12345", 10, 15);
        let b = generate_full_terrain("abc12345", 10, 15);
        assert_eq!(a.map, b.map);
        assert_eq!(a.ball_position, b.ball_position);
        assert_eq!(a.hole_position, b.hole_position);
    }
}

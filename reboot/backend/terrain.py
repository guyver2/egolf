"""
Terrain generation — Python port of the TypeScript implementation.

Symbol key:
  g = grass
  f = fairway
  s = sand
  t = tree
  w = water
"""

from __future__ import annotations
import math
from typing import Callable


def _string_to_unique_number(s: str) -> int:
    h = 0
    for ch in s:
        h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
        # Convert to signed 32-bit
        if h >= 0x80000000:
            h -= 0x100000000
    return abs(h) or 1


def _create_seeded_random(seed: str) -> Callable[[], float]:
    state = [_string_to_unique_number(seed)]

    def _next() -> float:
        state[0] = (state[0] * 16807) % 2147483647
        return (state[0] - 1) / 2147483646

    return _next


def _in_bounds(x: int, y: int, w: int, h: int) -> bool:
    return 0 <= x < w and 0 <= y < h


_NEIGHBORS = [(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)]


def _erode(terrain: list[list[str]], tile_type: str, w: int, h: int) -> list[list[str]]:
    temp = [row[:] for row in terrain]
    for y in range(h):
        for x in range(w):
            if terrain[y][x] == tile_type:
                neighbors = sum(
                    1
                    for dx, dy in _NEIGHBORS
                    if _in_bounds(x + dx, y + dy, w, h) and terrain[y + dy][x + dx] == tile_type
                )
                if neighbors < 8:
                    temp[y][x] = "g"
    return temp


def _dilate(terrain: list[list[str]], tile_type: str, w: int, h: int) -> list[list[str]]:
    temp = [row[:] for row in terrain]
    for y in range(h):
        for x in range(w):
            if terrain[y][x] == tile_type:
                for dx, dy in _NEIGHBORS:
                    nx, ny = x + dx, y + dy
                    if _in_bounds(nx, ny, w, h):
                        temp[ny][nx] = tile_type
    return temp


def _paint_blob(
    terrain: list[list[str]],
    cx: int,
    cy: int,
    size: int,
    tile_type: str,
    random: Callable[[], float],
    w: int,
    h: int,
) -> list[list[str]]:
    stack: list[tuple[int, int]] = [(cx, cy)]
    count = 0
    while stack and count < size:
        x, y = stack.pop()
        if _in_bounds(x, y, w, h):
            terrain[y][x] = tile_type
            count += 1
            if random() < 0.7:
                stack.append((x + 1, y))
            if random() < 0.7:
                stack.append((x - 1, y))
            if random() < 0.7:
                stack.append((x, y + 1))
            if random() < 0.7:
                stack.append((x, y - 1))
            if tile_type == "t":
                if random() < 0.4:
                    stack.append((x + 1, y + 1))
                if random() < 0.4:
                    stack.append((x - 1, y + 1))
                if random() < 0.4:
                    stack.append((x + 1, y - 1))
                if random() < 0.4:
                    stack.append((x - 1, y - 1))
            # Shuffle
            for i in range(len(stack) - 1, 0, -1):
                j = int(random() * (i + 1))
                stack[i], stack[j] = stack[j], stack[i]
            # Deduplicate
            stack = list(dict.fromkeys(stack))

    if tile_type != "t":
        terrain = _dilate(terrain, tile_type, w, h)
        terrain = _erode(terrain, tile_type, w, h)
    return terrain


def generate_terrain(seed: str, w: int, h: int) -> tuple[list[list[str]], Callable[[], float]]:
    """Generate a 2D terrain grid from a seed string.

    Returns (terrain, random) so callers can continue using the same PRNG
    sequence for ball / hole placement — matching the original JS behaviour.
    """
    random = _create_seeded_random(seed)
    rand_int = lambda lo, hi: int(random() * (hi - lo + 1)) + lo

    # Fill with grass
    terrain = [["g"] * w for _ in range(h)]

    # Fairway blobs — top quarter
    for _ in range(1):
        x = rand_int(0, w - 1)
        y = rand_int(0, h // 4)
        terrain = _paint_blob(terrain, x, y, rand_int(10, 30), "f", random, w, h)

    # Middle
    for _ in range(h // 6):
        x = rand_int(0, w - 1)
        y = rand_int(h // 4, (3 * h) // 4)
        terrain = _paint_blob(terrain, x, y, rand_int(10, 30), "f", random, w, h)

    # Bottom quarter
    for _ in range(2):
        x = rand_int(0, w - 1)
        y = rand_int((3 * h) // 4, h - 1)
        terrain = _paint_blob(terrain, x, y, rand_int(10, 30), "f", random, w, h)

    # Scatter sand, trees, water
    for _ in range(h // 2):
        x = rand_int(0, w - 1)
        y = rand_int(0, h - 1)
        r = random()
        t = "s" if r < 0.33 else ("t" if r < 0.66 else "w")
        terrain = _paint_blob(terrain, x, y, rand_int(10, 20), t, random, w, h)

    return terrain, random


def _set_neighbours_to_fairway(terrain: list[list[str]], pos: tuple[int, int], w: int, h: int) -> None:
    px, py = pos
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            x, y = px + dx, py + dy
            if 0 <= x < w and 0 <= y < h and not (dx == 0 and dy == 0):
                terrain[y][x] = "f"


def _find_ball_position(
    terrain: list[list[str]], w: int, h: int, rand_int: Callable[[int, int], int]
) -> tuple[int, int]:
    for _ in range(100):
        start_x = rand_int(0, w - 1)
        for y in range(h - 1, int(0.9 * h) - 1, -1):
            if terrain[y][start_x] == "f":
                return (start_x, y)
    return (1, h - 2)


def _find_hole_position(
    terrain: list[list[str]], w: int, h: int, rand_int: Callable[[int, int], int]
) -> tuple[int, int]:
    for _ in range(100):
        start_x = rand_int(0, w - 1)
        for y in range(h // 10):
            if terrain[y][start_x] == "f":
                return (start_x, y)
    return (w - 2, 1)


def generate_full_terrain(seed: str, w: int, h: int) -> dict:
    """
    Generate the full terrain data needed by the frontend:
    map grid, ball position, hole position, start position, par.
    """
    terrain, random = generate_terrain(seed, w, h)

    # Continue using the SAME PRNG for placement (matches original JS behaviour)
    rand_int = lambda lo, hi: int(random() * (hi - lo + 1)) + lo

    ball_pos = _find_ball_position(terrain, w, h, rand_int)
    hole_pos = _find_hole_position(terrain, w, h, rand_int)

    _set_neighbours_to_fairway(terrain, ball_pos, w, h)
    _set_neighbours_to_fairway(terrain, hole_pos, w, h)

    # Ensure the ball and hole tiles themselves are fairway (passable)
    terrain[ball_pos[1]][ball_pos[0]] = "f"
    terrain[hole_pos[1]][hole_pos[0]] = "f"

    par = (h // 5) + 1

    return {
        "map": terrain,
        "ball_position": list(ball_pos),
        "hole_position": list(hole_pos),
        "start_position": list(ball_pos),
        "par": par,
        "seed": seed,
        "width": w,
        "height": h,
    }

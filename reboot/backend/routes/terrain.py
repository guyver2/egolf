import io
import os
from pathlib import Path

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image

from terrain import generate_full_terrain

router = APIRouter()

CACHE_DIR = Path(os.path.dirname(__file__)).parent / "terrain_cache"
CACHE_DIR.mkdir(exist_ok=True)

# Tile colours matching the frontend SVG palette
TILE_COLORS: dict[str, tuple[int, int, int]] = {
    "g": (0x11, 0x66, 0x11),  # grass
    "f": (0x33, 0xAA, 0x33),  # fairway
    "s": (0xFF, 0xAA, 0x33),  # sand
    "t": (0x66, 0x66, 0x66),  # tree
    "w": (0x33, 0x33, 0xFF),  # water
}
HOLE_COLOR = (0x11, 0x11, 0x11)
START_COLOR = (0xAA, 0x33, 0x8A)
PX_PER_TILE = 6


def _render_terrain_image(data: dict) -> Image.Image:
    """Render a terrain map dict to a PIL Image (in memory)."""
    grid = data["map"]
    h = len(grid)
    w = len(grid[0]) if h else 0
    hole = tuple(data["hole_position"])
    start = tuple(data["start_position"])

    img = Image.new("RGB", (w * PX_PER_TILE, h * PX_PER_TILE))
    pixels = img.load()

    for row_idx, row in enumerate(grid):
        for col_idx, tile in enumerate(row):
            if (col_idx, row_idx) == hole:
                color = HOLE_COLOR
            elif (col_idx, row_idx) == start:
                color = START_COLOR
            else:
                color = TILE_COLORS.get(tile, TILE_COLORS["g"])

            for dy in range(PX_PER_TILE):
                for dx in range(PX_PER_TILE):
                    pixels[col_idx * PX_PER_TILE + dx, row_idx * PX_PER_TILE + dy] = color

    return img


def _image_to_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def save_terrain_thumbnail(seed: str, width: int, height: int) -> Path:
    """Generate the terrain thumbnail and persist it to disk. Returns the file path."""
    filename = f"{seed}_{width}x{height}.png"
    path = CACHE_DIR / filename
    if not path.exists():
        data = generate_full_terrain(seed, width, height)
        img = _render_terrain_image(data)
        img.save(path, format="PNG", optimize=True)
    return path


@router.get("/generate")
def generate(
    seed: str = Query(min_length=8, max_length=8),
    width: int = Query(ge=5, le=100),
    height: int = Query(ge=5, le=100),
):
    """Generate terrain from a seed and dimensions. Returns the map grid, positions, and par."""
    return generate_full_terrain(seed, width, height)


@router.get("/preview")
def preview(
    seed: str = Query(min_length=8, max_length=8),
    width: int = Query(ge=5, le=100),
    height: int = Query(ge=5, le=100),
):
    """Return a cached PNG preview of the terrain (persisted to disk)."""
    path = save_terrain_thumbnail(seed, width, height)
    return FileResponse(path, media_type="image/png", headers={
        "Cache-Control": "public, max-age=31536000, immutable",
    })


@router.get("/preview/draft")
def preview_draft(
    seed: str = Query(min_length=8, max_length=8),
    width: int = Query(ge=5, le=100),
    height: int = Query(ge=5, le=100),
):
    """Return a PNG preview generated in memory — nothing is saved to disk."""
    data = generate_full_terrain(seed, width, height)
    img = _render_terrain_image(data)
    png_bytes = _image_to_bytes(img)
    return StreamingResponse(
        io.BytesIO(png_bytes),
        media_type="image/png",
        headers={"Cache-Control": "no-store"},
    )

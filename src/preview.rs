use std::path::Path;

use image::{ImageBuffer, Rgb};

use crate::models::TerrainData;
use crate::terrain::generate_full_terrain;

const PX_PER_TILE: u32 = 6;

fn tile_color(tile: char, col: i32, row: i32, data: &TerrainData) -> Rgb<u8> {
    if data.hole_position == [col, row] {
        return Rgb([0x11, 0x11, 0x11]);
    }
    if data.start_position == [col, row] {
        return Rgb([0xAA, 0x33, 0x8A]);
    }
    match tile {
        'g' => Rgb([0x11, 0x66, 0x11]),
        'f' => Rgb([0x33, 0xAA, 0x33]),
        's' => Rgb([0xFF, 0xAA, 0x33]),
        't' => Rgb([0x66, 0x66, 0x66]),
        'w' => Rgb([0x33, 0x33, 0xFF]),
        _ => Rgb([0x11, 0x66, 0x11]),
    }
}

pub fn render_terrain_png(data: &TerrainData) -> Vec<u8> {
    let w = data.width as u32;
    let h = data.height as u32;
    let mut img: ImageBuffer<Rgb<u8>, Vec<u8>> =
        ImageBuffer::new(w * PX_PER_TILE, h * PX_PER_TILE);

    for (row_idx, row) in data.map.iter().enumerate() {
        for (col_idx, &tile) in row.iter().enumerate() {
            let color = tile_color(tile, col_idx as i32, row_idx as i32, data);
            for dy in 0..PX_PER_TILE {
                for dx in 0..PX_PER_TILE {
                    img.put_pixel(
                        col_idx as u32 * PX_PER_TILE + dx,
                        row_idx as u32 * PX_PER_TILE + dy,
                        color,
                    );
                }
            }
        }
    }

    let mut bytes = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut bytes);
    img.write_to(&mut cursor, image::ImageFormat::Png)
        .expect("png encode");
    bytes
}

pub fn cache_filename(seed: &str, width: i32, height: i32) -> String {
    format!("{seed}_{width}x{height}.png")
}

pub fn save_terrain_thumbnail(
    cache_dir: &Path,
    seed: &str,
    width: i32,
    height: i32,
) -> anyhow::Result<std::path::PathBuf> {
    std::fs::create_dir_all(cache_dir)?;
    let filename = cache_filename(seed, width, height);
    let path = cache_dir.join(&filename);
    if !path.exists() {
        let data = generate_full_terrain(seed, width, height);
        let png = render_terrain_png(&data);
        std::fs::write(&path, png)?;
    }
    Ok(path)
}

pub fn render_draft_png(seed: &str, width: i32, height: i32) -> Vec<u8> {
    let data = generate_full_terrain(seed, width, height);
    render_terrain_png(&data)
}

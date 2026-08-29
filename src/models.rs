use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub email: String,
    pub created_at: String,
}

#[derive(Debug, Clone)]
pub struct Hole {
    pub id: i64,
    pub name: String,
    pub seed: String,
    pub width: i32,
    pub height: i32,
    pub author_id: Option<i64>,
    pub author_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone)]
pub struct HolePlay {
    pub id: i64,
    pub hole_id: i64,
    pub user_id: i64,
    pub strokes: i32,
    pub created_at: String,
    pub user_name: Option<String>,
    pub hole_name: Option<String>,
    pub hole_seed: Option<String>,
    pub hole_width: Option<i32>,
    pub hole_height: Option<i32>,
    pub moves: Vec<Move>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub id: i64,
    pub move_order: i32,
    pub from_x: i32,
    pub from_y: i32,
    pub to_x: i32,
    pub to_y: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct TerrainData {
    pub map: Vec<Vec<char>>,
    pub ball_position: [i32; 2],
    pub hole_position: [i32; 2],
    pub start_position: [i32; 2],
    pub par: i32,
    pub seed: String,
    pub width: i32,
    pub height: i32,
}

impl TerrainData {
    pub fn tile_at(&self, col: i32, row: i32) -> Option<char> {
        self.map.get(row as usize)?.get(col as usize).copied()
    }
}

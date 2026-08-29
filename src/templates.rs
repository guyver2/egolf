use askama::Template;

use crate::models::{Hole, HolePlay, TerrainData, User};

pub struct MapTile {
    pub tile: char,
    pub class: &'static str,
    pub col: i32,
    pub row: i32,
    pub is_ball: bool,
    pub is_hole: bool,
    pub is_start: bool,
}

pub fn build_map_tiles(terrain: &TerrainData) -> Vec<MapTile> {
    let mut tiles = Vec::new();
    for (row_idx, row) in terrain.map.iter().enumerate() {
        for (col_idx, &tile) in row.iter().enumerate() {
            let col = col_idx as i32;
            let row = row_idx as i32;
            tiles.push(MapTile {
                tile,
                class: tile_class(tile),
                col,
                row,
                is_ball: terrain.ball_position == [col, row],
                is_hole: terrain.hole_position == [col, row],
                is_start: terrain.start_position == [col, row],
            });
        }
    }
    tiles
}

pub fn manhattan_dist(terrain: &TerrainData) -> i32 {
    (terrain.ball_position[0] - terrain.hole_position[0]).abs()
        + (terrain.ball_position[1] - terrain.hole_position[1]).abs()
}

#[derive(Template)]
#[template(path = "game_page.html")]
pub struct GamePageTemplate<'a> {
    pub title: &'a str,
    pub user: Option<&'a User>,
    pub terrain: TerrainData,
    pub tiles: Vec<MapTile>,
    pub terrain_json: String,
    pub hole_id: i64,
    pub show_random_button: bool,
    pub show_save_button: bool,
    pub allow_save: bool,
    pub user_logged_in: bool,
    pub formatted_seed: String,
    pub dist: i32,
}

#[derive(Template)]
#[template(path = "login.html")]
pub struct LoginTemplate<'a> {
    pub user: Option<&'a User>,
    pub error: Option<String>,
}

#[derive(Template)]
#[template(path = "signup.html")]
pub struct SignupTemplate<'a> {
    pub user: Option<&'a User>,
    pub error: Option<String>,
}

#[derive(Template)]
#[template(path = "holes.html")]
pub struct HolesTemplate<'a> {
    pub user: Option<&'a User>,
    pub holes: Vec<Hole>,
    pub page: i64,
    pub total_pages: i64,
}

#[derive(Template)]
#[template(path = "create_hole.html")]
pub struct CreateHoleTemplate<'a> {
    pub user: Option<&'a User>,
    pub name: String,
    pub seed: String,
    pub width: i32,
    pub height: i32,
    pub formatted_seed: String,
    pub preview_url: String,
    pub error: Option<String>,
}

pub struct ReplayRow {
    pub rank: i32,
    pub play: HolePlay,
}

#[derive(Template)]
#[template(path = "hole_replays.html")]
pub struct HoleReplaysTemplate<'a> {
    pub user: Option<&'a User>,
    pub hole: Hole,
    pub rows: Vec<ReplayRow>,
    pub page: i64,
    pub total_pages: i64,
    pub total: i64,
    pub formatted_seed: String,
}

#[derive(Template)]
#[template(path = "profile.html")]
pub struct ProfileTemplate<'a> {
    pub user: Option<&'a User>,
    pub username: String,
    pub plays: Vec<HolePlay>,
}

#[derive(Template)]
#[template(path = "replay.html")]
pub struct ReplayTemplate<'a> {
    pub user: Option<&'a User>,
    pub play: HolePlay,
    pub terrain: TerrainData,
    pub tiles: Vec<MapTile>,
    pub positions_json: String,
    pub total_moves: usize,
}

pub fn terrain_to_json(terrain: &TerrainData) -> String {
    #[derive(serde::Serialize)]
    struct JsonTerrain<'a> {
        map: &'a [Vec<char>],
        ball_position: [i32; 2],
        hole_position: [i32; 2],
        start_position: [i32; 2],
        par: i32,
        seed: &'a str,
        width: i32,
        height: i32,
    }
    serde_json::to_string(&JsonTerrain {
        map: &terrain.map,
        ball_position: terrain.ball_position,
        hole_position: terrain.hole_position,
        start_position: terrain.start_position,
        par: terrain.par,
        seed: &terrain.seed,
        width: terrain.width,
        height: terrain.height,
    })
    .unwrap_or_else(|_| "{}".into())
}

pub fn replay_positions_json(play: &HolePlay) -> String {
    let mut positions = Vec::new();
    if let Some(first) = play.moves.first() {
        positions.push([first.from_x, first.from_y]);
    }
    for m in &play.moves {
        positions.push([m.to_x, m.to_y]);
    }
    serde_json::to_string(&positions).unwrap_or_else(|_| "[]".into())
}

pub fn tile_class(tile: char) -> &'static str {
    match tile {
        'g' => "grass",
        'f' => "fairway",
        's' => "sand",
        't' => "tree",
        'w' => "water",
        _ => "grass",
    }
}

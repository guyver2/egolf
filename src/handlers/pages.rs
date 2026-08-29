use axum::extract::{Path, Query, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Redirect};
use axum_extra::extract::CookieJar;
use axum::{Form, Json};
use serde::Deserialize;

use crate::auth::{
    clear_auth_cookie, create_token, create_user, current_user, email_exists, get_user_by_username,
    set_auth_cookie, username_exists, verify_password,
};
use crate::preview::{render_draft_png, save_terrain_thumbnail};
use crate::render::render;
use crate::state::AppState;
use crate::store::{
    create_hole, create_hole_play, ensure_hole, get_hole, get_hole_play, hole_exists, list_hole_plays,
    list_holes, pages, random_seed, sanitise_seed, format_seed,
};
use crate::templates::{
    build_map_tiles, manhattan_dist, replay_positions_json, terrain_to_json, CreateHoleTemplate,
    GamePageTemplate, HoleReplaysTemplate, HolesTemplate, LoginTemplate, ProfileTemplate,
    ReplayRow, ReplayTemplate, SignupTemplate,
};
use crate::terrain::generate_full_terrain;

#[derive(Deserialize)]
pub struct PageQuery {
    pub page: Option<i32>,
}

#[derive(Deserialize)]
pub struct TerrainQuery {
    pub seed: String,
    pub width: i32,
    pub height: i32,
}

#[derive(Deserialize)]
pub struct LoginForm {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct SignupForm {
    pub username: String,
    pub email: String,
    pub password: String,
    pub confirm_password: String,
}

#[derive(Deserialize)]
pub struct CreateHoleForm {
    pub name: String,
    pub seed: String,
    pub width: i32,
    pub height: i32,
}

#[derive(Deserialize)]
pub struct SaveHoleForm {
    pub name: Option<String>,
    pub seed: String,
    pub width: i32,
    pub height: i32,
}

#[derive(Deserialize)]
pub struct SavePlayForm {
    #[serde(default)]
    pub hole_id: i64,
    pub hole: Option<SaveHoleForm>,
    pub moves: Vec<MoveForm>,
}

#[derive(Deserialize)]
pub struct MoveForm {
    pub from_x: i32,
    pub from_y: i32,
    pub to_x: i32,
    pub to_y: i32,
}

fn game_template<'a>(
    title: &'a str,
    user: Option<&'a crate::models::User>,
    terrain: crate::models::TerrainData,
    hole_id: i64,
    show_random: bool,
    show_save: bool,
    allow_save: bool,
) -> GamePageTemplate<'a> {
    let formatted_seed = format_seed(&terrain.seed);
    let dist = manhattan_dist(&terrain);
    let tiles = build_map_tiles(&terrain);
    let terrain_json = terrain_to_json(&terrain);
    GamePageTemplate {
        title,
        user,
        terrain,
        tiles,
        terrain_json,
        hole_id,
        show_random_button: show_random,
        show_save_button: show_save,
        allow_save,
        user_logged_in: user.is_some(),
        formatted_seed,
        dist,
    }
}

pub async fn health() -> &'static str {
    "ok"
}

pub async fn home(State(state): State<AppState>, jar: CookieJar) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    let seed = random_seed();
    let terrain = generate_full_terrain(&seed, 10, 15);
    render(game_template("Home", user.as_ref(), terrain, -1, true, true, false))
}

pub async fn login_page(jar: CookieJar, State(state): State<AppState>) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    render(LoginTemplate {
        user: user.as_ref(),
        error: None,
    })
}

pub async fn login_submit(
    State(state): State<AppState>,
    jar: CookieJar,
    Form(form): Form<LoginForm>,
) -> impl IntoResponse {
    match get_user_by_username(&state.pool, &form.username) {
        Ok((user, hash)) if verify_password(&form.password, &hash) => {
            let token = create_token(user.id, &user.username, state.jwt_secret()).unwrap();
            let jar = set_auth_cookie(jar, &token);
            (jar, Redirect::to("/")).into_response()
        }
        _ => render(LoginTemplate {
            user: None,
            error: Some("Invalid username or password".into()),
        })
        .into_response(),
    }
}

pub async fn signup_page(jar: CookieJar, State(state): State<AppState>) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    render(SignupTemplate {
        user: user.as_ref(),
        error: None,
    })
}

pub async fn signup_submit(
    State(state): State<AppState>,
    Form(form): Form<SignupForm>,
) -> impl IntoResponse {
    if !state.registration_enabled() {
        return render(SignupTemplate {
            user: None,
            error: Some("Registration is currently disabled".into()),
        })
        .into_response();
    }
    if form.password != form.confirm_password {
        return render(SignupTemplate {
            user: None,
            error: Some("Passwords do not match".into()),
        })
        .into_response();
    }
    if username_exists(&state.pool, &form.username).unwrap_or(false) {
        return render(SignupTemplate {
            user: None,
            error: Some("Username already taken".into()),
        })
        .into_response();
    }
    if email_exists(&state.pool, &form.email).unwrap_or(false) {
        return render(SignupTemplate {
            user: None,
            error: Some("Email already registered".into()),
        })
        .into_response();
    }
    if create_user(&state.pool, &form.username, &form.email, &form.password).is_err() {
        return render(SignupTemplate {
            user: None,
            error: Some("Signup failed".into()),
        })
        .into_response();
    }
    Redirect::to("/login").into_response()
}

pub async fn logout(jar: CookieJar) -> impl IntoResponse {
    let jar = clear_auth_cookie(jar);
    (jar, Redirect::to("/")).into_response()
}

pub async fn holes_list(
    State(state): State<AppState>,
    jar: CookieJar,
    Query(q): Query<PageQuery>,
) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    let page = q.page.unwrap_or(0) as i64;
    let limit = 20;
    let (holes, total) = list_holes(&state.pool, page as i32, limit).unwrap_or_default();
    render(HolesTemplate {
        user: user.as_ref(),
        holes,
        page,
        total_pages: pages(total, limit),
    })
}

pub async fn create_hole_page(
    State(state): State<AppState>,
    jar: CookieJar,
) -> impl IntoResponse {
    let user = match current_user(&state.pool, &jar, state.jwt_secret()) {
        Some(u) => u,
        None => return Redirect::to("/login").into_response(),
    };
    let seed = random_seed();
    let width = 10;
    let height = 15;
    render(CreateHoleTemplate {
        user: Some(&user),
        name: String::new(),
        seed: seed.clone(),
        width,
        height,
        formatted_seed: format_seed(&seed),
        preview_url: format!("/terrain/preview/draft?seed={seed}&width={width}&height={height}"),
        error: None,
    })
}

pub async fn create_hole_submit(
    State(state): State<AppState>,
    jar: CookieJar,
    Form(form): Form<CreateHoleForm>,
) -> impl IntoResponse {
    let user = match current_user(&state.pool, &jar, state.jwt_secret()) {
        Some(u) => u,
        None => return Redirect::to("/login").into_response(),
    };
    let seed = sanitise_seed(&form.seed);
    let name = if form.name.trim().is_empty() {
        format!("Hole {seed}")
    } else {
        form.name.trim().to_string()
    };
    if hole_exists(&state.pool, &seed, form.width, form.height).unwrap_or(false) {
        return render(CreateHoleTemplate {
            user: Some(&user),
            name,
            seed: seed.clone(),
            width: form.width,
            height: form.height,
            formatted_seed: format_seed(&seed),
            preview_url: format!(
                "/terrain/preview/draft?seed={seed}&width={}&height={}",
                form.width, form.height
            ),
            error: Some("A hole with this seed and dimensions already exists".into()),
        })
        .into_response();
    }
    let hole = create_hole(
        &state.pool,
        &name,
        &seed,
        form.width,
        form.height,
        user.id,
    )
    .unwrap();
    let _ = save_terrain_thumbnail(state.terrain_cache_dir(), &seed, form.width, form.height);
    Redirect::to(&format!("/play/hole/{}", hole.id)).into_response()
}

pub async fn play_hole(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    let hole = match get_hole(&state.pool, id) {
        Ok(h) => h,
        Err(_) => return (StatusCode::NOT_FOUND, "Hole not found").into_response(),
    };
    let terrain = generate_full_terrain(&hole.seed, hole.width, hole.height);
    render(game_template(
        &hole.name,
        user.as_ref(),
        terrain,
        hole.id,
        false,
        false,
        true,
    ))
}

pub async fn hole_replays(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<i64>,
    Query(q): Query<PageQuery>,
) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    let hole = match get_hole(&state.pool, id) {
        Ok(h) => h,
        Err(_) => return (StatusCode::NOT_FOUND, "Hole not found").into_response(),
    };
    let page = q.page.unwrap_or(0) as i64;
    let limit = 20;
    let (plays, total) =
        list_hole_plays(&state.pool, page as i32, limit, None, Some(id), "best").unwrap_or_default();
    let rows: Vec<ReplayRow> = plays
        .into_iter()
        .enumerate()
        .map(|(i, play)| ReplayRow {
            rank: (page * limit as i64 + i as i64 + 1) as i32,
            play,
        })
        .collect();
    let formatted_seed = format_seed(&hole.seed);
    render(HoleReplaysTemplate {
        user: user.as_ref(),
        hole,
        rows,
        page,
        total_pages: pages(total, limit),
        total,
        formatted_seed,
    })
}

pub async fn profile(State(state): State<AppState>, jar: CookieJar) -> impl IntoResponse {
    let user = match current_user(&state.pool, &jar, state.jwt_secret()) {
        Some(u) => u,
        None => return Redirect::to("/login").into_response(),
    };
    let (plays, _) =
        list_hole_plays(&state.pool, 0, 50, Some(user.id), None, "recent").unwrap_or_default();
    render(ProfileTemplate {
        user: Some(&user),
        username: user.username.clone(),
        plays,
    })
}

pub async fn replay_view(
    State(state): State<AppState>,
    jar: CookieJar,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let user = current_user(&state.pool, &jar, state.jwt_secret());
    let play = match get_hole_play(&state.pool, id) {
        Ok(p) => p,
        Err(_) => return (StatusCode::NOT_FOUND, "Replay not found").into_response(),
    };
    let seed = play.hole_seed.clone().unwrap_or_default();
    let width = play.hole_width.unwrap_or(10);
    let height = play.hole_height.unwrap_or(15);
    let terrain = generate_full_terrain(&seed, width, height);
    let tiles = build_map_tiles(&terrain);
    let positions_json = replay_positions_json(&play);
    let total_moves = play.moves.len();
    render(ReplayTemplate {
        user: user.as_ref(),
        play,
        terrain,
        tiles,
        positions_json,
        total_moves,
    })
}

pub async fn terrain_preview(
    State(state): State<AppState>,
    Query(q): Query<TerrainQuery>,
) -> impl IntoResponse {
    let seed = sanitise_seed(&q.seed);
    match save_terrain_thumbnail(state.terrain_cache_dir(), &seed, q.width, q.height) {
        Ok(path) => match std::fs::read(&path) {
            Ok(bytes) => (
                [(header::CONTENT_TYPE, "image/png"), (header::CACHE_CONTROL, "public, max-age=31536000, immutable")],
                bytes,
            )
                .into_response(),
            Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        },
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn terrain_preview_draft(Query(q): Query<TerrainQuery>) -> impl IntoResponse {
    let seed = sanitise_seed(&q.seed);
    let png = render_draft_png(&seed, q.width, q.height);
    (
        [
            (header::CONTENT_TYPE, "image/png"),
            (header::CACHE_CONTROL, "no-store"),
        ],
        png,
    )
        .into_response()
}

pub async fn save_hole(
    State(state): State<AppState>,
    jar: CookieJar,
    Form(form): Form<SaveHoleForm>,
) -> impl IntoResponse {
    let user = match current_user(&state.pool, &jar, state.jwt_secret()) {
        Some(u) => u,
        None => return StatusCode::UNAUTHORIZED.into_response(),
    };
    let seed = sanitise_seed(&form.seed);
    let name = form
        .name
        .filter(|n| !n.trim().is_empty())
        .unwrap_or_else(|| format!("Hole {seed}"));
    match ensure_hole(&state.pool, &name, &seed, form.width, form.height, user.id) {
        Ok(id) => {
            let _ = save_terrain_thumbnail(state.terrain_cache_dir(), &seed, form.width, form.height);
            axum::Json(serde_json::json!({ "id": id })).into_response()
        }
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn terrain_json(Query(q): Query<TerrainQuery>) -> impl IntoResponse {
    let seed = sanitise_seed(&q.seed);
    let terrain = generate_full_terrain(&seed, q.width, q.height);
    axum::Json(serde_json::json!({
        "map": terrain.map,
        "ball_position": terrain.ball_position,
        "hole_position": terrain.hole_position,
        "start_position": terrain.start_position,
        "par": terrain.par,
        "seed": terrain.seed,
        "width": terrain.width,
        "height": terrain.height,
    }))
    .into_response()
}

pub async fn save_play(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(form): Json<SavePlayForm>,
) -> impl IntoResponse {
    let user = match current_user(&state.pool, &jar, state.jwt_secret()) {
        Some(u) => u,
        None => return StatusCode::UNAUTHORIZED.into_response(),
    };
    let hole_id = if form.hole_id > 0 && get_hole(&state.pool, form.hole_id).is_ok() {
        form.hole_id
    } else if let Some(hole) = form.hole {
        let seed = sanitise_seed(&hole.seed);
        let name = hole
            .name
            .filter(|n| !n.trim().is_empty())
            .unwrap_or_else(|| format!("Hole {seed}"));
        match ensure_hole(&state.pool, &name, &seed, hole.width, hole.height, user.id) {
            Ok(id) => {
                let _ = save_terrain_thumbnail(state.terrain_cache_dir(), &seed, hole.width, hole.height);
                id
            }
            Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
        }
    } else {
        return StatusCode::BAD_REQUEST.into_response();
    };
    let moves: Vec<(i32, i32, i32, i32)> = form
        .moves
        .iter()
        .map(|m| (m.from_x, m.from_y, m.to_x, m.to_y))
        .collect();
    if moves.is_empty() {
        return StatusCode::BAD_REQUEST.into_response();
    }
    match create_hole_play(&state.pool, hole_id, user.id, &moves) {
        Ok(id) => axum::Json(serde_json::json!({ "id": id, "hole_id": hole_id })).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}


mod pages;

pub use pages::*;

use axum::{
    routing::{get, post},
    Router,
};
use tower_http::services::ServeDir;

use crate::state::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/", get(home))
        .route("/login", get(login_page).post(login_submit))
        .route("/signup", get(signup_page).post(signup_submit))
        .route("/logout", post(logout))
        .route("/holes", get(holes_list))
        .route("/create-hole", get(create_hole_page).post(create_hole_submit))
        .route("/play/hole/{id}", get(play_hole))
        .route("/holes/{id}/replays", get(hole_replays))
        .route("/profile", get(profile))
        .route("/replay/{id}", get(replay_view))
        .route("/terrain/preview", get(terrain_preview))
        .route("/terrain/preview/draft", get(terrain_preview_draft))
        .route("/terrain/json", get(terrain_json))
        .route("/game/save-hole", post(save_hole))
        .route("/game/save-play", post(save_play))
        .nest_service("/assets", ServeDir::new("assets"))
        .with_state(state)
}

pub async fn serve(state: AppState) -> anyhow::Result<()> {
    let port = state.config.port;
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    tracing::info!("eGolf listening on http://0.0.0.0:{port}");
    axum::serve(listener, router(state)).await?;
    Ok(())
}

mod auth;
mod config;
mod db;
mod handlers;
mod migrate;
mod models;
mod preview;
mod render;
mod state;
mod store;
mod templates;
mod terrain;

use std::sync::Arc;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let args: Vec<String> = std::env::args().collect();
    let config = config::Config::from_env();
    config.ensure_dirs()?;

    migrate::run_all(config.database_path_str())?;

    if args.iter().any(|a| a == "migrate") {
        migrate::run_cli(&args[1..], config.database_path_str())?;
        return Ok(());
    }

    let pool = db::create_pool(config.database_path_str())?;
    let state = AppState {
        pool,
        config: Arc::new(config),
    };

    handlers::serve(state).await
}

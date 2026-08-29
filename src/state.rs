use std::sync::Arc;

use crate::config::Config;
use crate::db::DbPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: DbPool,
    pub config: Arc<Config>,
}

impl AppState {
    pub fn jwt_secret(&self) -> &str {
        &self.config.jwt_secret
    }

    pub fn registration_enabled(&self) -> bool {
        self.config.registration_enabled
    }

    pub fn terrain_cache_dir(&self) -> &std::path::Path {
        self.config.terrain_cache_dir()
    }
}

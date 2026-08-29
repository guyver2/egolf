use std::path::{Path, PathBuf};

#[derive(Clone, Debug)]
pub struct Config {
    pub database_path: PathBuf,
    pub jwt_secret: String,
    pub registration_enabled: bool,
    pub port: u16,
    pub terrain_cache_dir: PathBuf,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            database_path: PathBuf::from(
                std::env::var("DATABASE_PATH").unwrap_or_else(|_| "egolf.db".into()),
            ),
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "dev-secret-change-me".into()),
            registration_enabled: matches!(
                std::env::var("REGISTRATION_ENABLED")
                    .unwrap_or_else(|_| "true".into())
                    .to_lowercase()
                    .as_str(),
                "true" | "1" | "yes"
            ),
            port: std::env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8080),
            terrain_cache_dir: PathBuf::from(
                std::env::var("TERRAIN_CACHE_DIR").unwrap_or_else(|_| "terrain_cache".into()),
            ),
        }
    }

    pub fn ensure_dirs(&self) -> anyhow::Result<()> {
        if let Some(parent) = self.database_path.parent() {
            if !parent.as_os_str().is_empty() {
                std::fs::create_dir_all(parent)?;
            }
        }
        std::fs::create_dir_all(&self.terrain_cache_dir)?;
        Ok(())
    }

    pub fn database_path_str(&self) -> &str {
        self.database_path.to_str().unwrap_or("egolf.db")
    }

    pub fn terrain_cache_dir(&self) -> &Path {
        &self.terrain_cache_dir
    }
}

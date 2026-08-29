use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::Connection;

const MIGRATIONS_DIR: &str = "migrations";

pub fn run_all(database_path: &str) -> anyhow::Result<()> {
    let conn = Connection::open(database_path)?;
    crate::db::configure_connection(&conn)?;
    ensure_migrations_table(&conn)?;

    let pending = get_pending_migrations(&conn)?;
    if pending.is_empty() {
        tracing::info!("No pending migrations.");
        return Ok(());
    }

    tracing::info!("Applying {} migration(s)...", pending.len());
    for filename in pending {
        apply_migration(&conn, &filename)?;
    }
    Ok(())
}

fn ensure_migrations_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );",
    )
}

fn migrations_dir() -> PathBuf {
    PathBuf::from(MIGRATIONS_DIR)
}

fn get_applied_migrations(conn: &Connection) -> rusqlite::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT filename FROM _migrations ORDER BY filename")?;
    let rows = stmt.query_map([], |row| row.get(0))?;
    rows.collect()
}

fn get_all_migration_files() -> anyhow::Result<Vec<String>> {
    let dir = migrations_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut files: Vec<String> = fs::read_dir(&dir)?
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|f| f.ends_with(".sql") && !f.ends_with(".down.sql"))
        .collect();
    files.sort();
    Ok(files)
}

fn get_pending_migrations(conn: &Connection) -> rusqlite::Result<Vec<String>> {
    let applied: std::collections::HashSet<String> =
        get_applied_migrations(conn)?.into_iter().collect();
    Ok(get_all_migration_files()
        .unwrap_or_default()
        .into_iter()
        .filter(|f| !applied.contains(f))
        .collect())
}

fn apply_migration(conn: &Connection, filename: &str) -> anyhow::Result<()> {
    let path = migrations_dir().join(filename);
    let sql = fs::read_to_string(&path)?;
    tracing::info!("Applying {filename}...");
    conn.execute_batch(&sql)?;
    conn.execute(
        "INSERT INTO _migrations (filename) VALUES (?1)",
        [filename],
    )?;
    Ok(())
}

pub fn run_cli(args: &[String], database_path: &str) -> anyhow::Result<()> {
    if args.iter().any(|a| a == "--status") {
        show_status(database_path)?;
    } else if args.iter().any(|a| a == "--down") {
        run_down(database_path)?;
    } else if args.iter().any(|a| a == "--up") {
        run_up(database_path)?;
    } else {
        run_all(database_path)?;
    }
    Ok(())
}

fn show_status(database_path: &str) -> anyhow::Result<()> {
    let conn = Connection::open(database_path)?;
    ensure_migrations_table(&conn)?;
    let applied: std::collections::HashSet<String> =
        get_applied_migrations(&conn)?.into_iter().collect();
    println!("Migration status:");
    for f in get_all_migration_files()? {
        let status = if applied.contains(&f) {
            "APPLIED"
        } else {
            "PENDING"
        };
        println!("  [{status}] {f}");
    }
    Ok(())
}

fn run_up(database_path: &str) -> anyhow::Result<()> {
    let conn = Connection::open(database_path)?;
    crate::db::configure_connection(&conn)?;
    ensure_migrations_table(&conn)?;
    if let Some(filename) = get_pending_migrations(&conn)?.into_iter().next() {
        apply_migration(&conn, &filename)?;
    } else {
        println!("No pending migrations.");
    }
    Ok(())
}

fn run_down(database_path: &str) -> anyhow::Result<()> {
    let conn = Connection::open(database_path)?;
    ensure_migrations_table(&conn)?;
    let applied = get_applied_migrations(&conn)?;
    let Some(last) = applied.last() else {
        println!("No applied migrations to rollback.");
        return Ok(());
    };
    let down_name = last.replace(".sql", ".down.sql");
    let down_path = migrations_dir().join(&down_name);
    if !down_path.exists() {
        anyhow::bail!("No down migration found: {down_name}");
    }
    let sql = fs::read_to_string(&down_path)?;
    tracing::info!("Rolling back {last}...");
    conn.execute_batch(&sql)?;
    conn.execute("DELETE FROM _migrations WHERE filename = ?1", [last])?;
    Ok(())
}

pub fn clear_terrain_cache(cache_dir: &Path) -> anyhow::Result<()> {
    if cache_dir.exists() {
        for entry in fs::read_dir(cache_dir)? {
            let entry = entry?;
            if entry.path().is_file() {
                fs::remove_file(entry.path())?;
            }
        }
    }
    Ok(())
}

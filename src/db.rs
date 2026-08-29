use r2d2::Pool;
use rusqlite::Connection;

pub type DbPool = Pool<r2d2_sqlite::SqliteConnectionManager>;

pub fn create_pool(database_path: &str) -> anyhow::Result<DbPool> {
    let manager = r2d2_sqlite::SqliteConnectionManager::file(database_path);
    let pool = Pool::builder().max_size(16).build(manager)?;
    {
        let conn = pool.get()?;
        configure_connection(&conn)?;
    }
    Ok(pool)
}

pub fn configure_connection(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA foreign_keys=ON;",
    )
}

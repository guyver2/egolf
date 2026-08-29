use crate::db::DbPool;
use crate::models::{Hole, HolePlay, Move};

pub fn list_holes(pool: &DbPool, page: i32, limit: i32) -> anyhow::Result<(Vec<Hole>, i64)> {
    let conn = pool.get()?;
    let offset = page * limit;
    let mut stmt = conn.prepare(
        "SELECT h.id, h.name, h.seed, h.width, h.height, h.author_id, h.created_at,
                u.username AS author_name
         FROM holes h
         LEFT JOIN users u ON h.author_id = u.id
         ORDER BY h.created_at DESC
         LIMIT ?1 OFFSET ?2",
    )?;
    let holes = stmt
        .query_map(rusqlite::params![limit, offset], map_hole_row)?
        .collect::<Result<Vec<_>, _>>()?;
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM holes", [], |r| r.get(0))?;
    Ok((holes, total))
}

pub fn get_hole(pool: &DbPool, id: i64) -> anyhow::Result<Hole> {
    let conn = pool.get()?;
    conn.query_row(
        "SELECT h.id, h.name, h.seed, h.width, h.height, h.author_id, h.created_at,
                u.username AS author_name
         FROM holes h
         LEFT JOIN users u ON h.author_id = u.id
         WHERE h.id = ?1",
        [id],
        map_hole_row,
    )
    .map_err(Into::into)
}

pub fn create_hole(
    pool: &DbPool,
    name: &str,
    seed: &str,
    width: i32,
    height: i32,
    author_id: i64,
) -> anyhow::Result<Hole> {
    let conn = pool.get()?;
    conn.execute(
        "INSERT INTO holes (name, seed, width, height, author_id) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![name, seed, width, height, author_id],
    )?;
    let id = conn.last_insert_rowid();
    get_hole(pool, id)
}

pub fn hole_exists(pool: &DbPool, seed: &str, width: i32, height: i32) -> anyhow::Result<bool> {
    let conn = pool.get()?;
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM holes WHERE seed = ?1 AND width = ?2 AND height = ?3",
        rusqlite::params![seed, width, height],
        |r| r.get(0),
    )?;
    Ok(count > 0)
}

pub fn list_hole_plays(
    pool: &DbPool,
    page: i32,
    limit: i32,
    user_id: Option<i64>,
    hole_id: Option<i64>,
    sort: &str,
) -> anyhow::Result<(Vec<HolePlay>, i64)> {
    let order = match sort {
        "best" => "hp.strokes ASC, hp.created_at ASC",
        _ => "hp.created_at DESC",
    };
    let mut conditions = Vec::new();
    let mut params: Vec<rusqlite::types::Value> = Vec::new();
    if let Some(uid) = user_id {
        conditions.push("hp.user_id = ?".to_string());
        params.push(uid.into());
    }
    if let Some(hid) = hole_id {
        conditions.push("hp.hole_id = ?".to_string());
        params.push(hid.into());
    }
    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let count_sql = format!("SELECT COUNT(*) FROM hole_plays hp {where_clause}");
    let conn = pool.get()?;
    let total: i64 = conn.query_row(
        &count_sql,
        rusqlite::params_from_iter(params.iter().cloned()),
        |r| r.get(0),
    )?;

    let offset = page * limit;
    let list_sql = format!(
        "SELECT hp.id, hp.hole_id, hp.user_id, hp.strokes, hp.created_at,
                u.username AS user_name,
                h.name AS hole_name, h.seed AS hole_seed,
                h.width AS hole_width, h.height AS hole_height
         FROM hole_plays hp
         JOIN users u ON hp.user_id = u.id
         JOIN holes h ON hp.hole_id = h.id
         {where_clause}
         ORDER BY {order}
         LIMIT ? OFFSET ?"
    );
    let mut list_params = params;
    list_params.push(limit.into());
    list_params.push(offset.into());

    let mut stmt = conn.prepare(&list_sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(list_params), |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, i32>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, Option<String>>(6)?,
            row.get::<_, Option<String>>(7)?,
            row.get::<_, Option<i32>>(8)?,
            row.get::<_, Option<i32>>(9)?,
        ))
    })?;

    let mut plays = Vec::new();
    for row in rows {
        let (id, hole_id, user_id, strokes, created_at, user_name, hole_name, hole_seed, hole_width, hole_height) =
            row?;
        let moves = get_moves(&conn, id)?;
        plays.push(HolePlay {
            id,
            hole_id,
            user_id,
            strokes,
            created_at,
            user_name,
            hole_name,
            hole_seed,
            hole_width,
            hole_height,
            moves,
        });
    }
    Ok((plays, total))
}

pub fn get_hole_play(pool: &DbPool, id: i64) -> anyhow::Result<HolePlay> {
    let conn = pool.get()?;
    let row = conn.query_row(
        "SELECT hp.id, hp.hole_id, hp.user_id, hp.strokes, hp.created_at,
                u.username AS user_name,
                h.name AS hole_name, h.seed AS hole_seed,
                h.width AS hole_width, h.height AS hole_height
         FROM hole_plays hp
         JOIN users u ON hp.user_id = u.id
         JOIN holes h ON hp.hole_id = h.id
         WHERE hp.id = ?1",
        [id],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i32>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<i32>>(8)?,
                row.get::<_, Option<i32>>(9)?,
            ))
        },
    )?;
    let moves = get_moves(&conn, row.0)?;
    Ok(HolePlay {
        id: row.0,
        hole_id: row.1,
        user_id: row.2,
        strokes: row.3,
        created_at: row.4,
        user_name: row.5,
        hole_name: row.6,
        hole_seed: row.7,
        hole_width: row.8,
        hole_height: row.9,
        moves,
    })
}

fn get_moves(conn: &rusqlite::Connection, play_id: i64) -> rusqlite::Result<Vec<Move>> {
    let mut stmt = conn.prepare(
        "SELECT id, move_order, from_x, from_y, to_x, to_y
         FROM hole_play_moves WHERE hole_play_id = ?1 ORDER BY move_order",
    )?;
    let rows = stmt.query_map([play_id], |row| {
        Ok(Move {
            id: row.get(0)?,
            move_order: row.get(1)?,
            from_x: row.get(2)?,
            from_y: row.get(3)?,
            to_x: row.get(4)?,
            to_y: row.get(5)?,
        })
    })?;
    rows.collect()
}

pub fn create_hole_play(
    pool: &DbPool,
    hole_id: i64,
    user_id: i64,
    moves: &[(i32, i32, i32, i32)],
) -> anyhow::Result<HolePlay> {
    let conn = pool.get()?;
    let strokes = moves.len() as i32;
    conn.execute(
        "INSERT INTO hole_plays (hole_id, user_id, strokes) VALUES (?1, ?2, ?3)",
        rusqlite::params![hole_id, user_id, strokes],
    )?;
    let play_id = conn.last_insert_rowid();
    for (i, (fx, fy, tx, ty)) in moves.iter().enumerate() {
        conn.execute(
            "INSERT INTO hole_play_moves (hole_play_id, move_order, from_x, from_y, to_x, to_y)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![play_id, i as i32, fx, fy, tx, ty],
        )?;
    }
    get_hole_play(pool, play_id)
}

fn map_hole_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Hole> {
    Ok(Hole {
        id: row.get(0)?,
        name: row.get(1)?,
        seed: row.get(2)?,
        width: row.get(3)?,
        height: row.get(4)?,
        author_id: row.get(5)?,
        created_at: row.get(6)?,
        author_name: row.get(7)?,
    })
}

pub fn pages(total: i64, limit: i32) -> i64 {
    if total <= 0 {
        0
    } else {
        (total + limit as i64 - 1) / limit as i64
    }
}

pub fn sanitise_seed(raw: &str) -> String {
    let cleaned: String = raw
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() { c } else { '0' })
        .take(8)
        .collect();
    format!("{:0<8}", cleaned)
}

pub fn random_seed() -> String {
    use rand::Rng;
    const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::rng();
    (0..8)
        .map(|_| CHARS[rng.random_range(0..CHARS.len())] as char)
        .collect()
}

pub fn format_seed(seed: &str) -> String {
    let s = sanitise_seed(seed);
    format!("{}-{}", &s[..4], &s[4..])
}

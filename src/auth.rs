use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::db::DbPool;
use crate::models::User;

const COOKIE_NAME: &str = "access_token";

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    Ok(bcrypt::hash(password, bcrypt::DEFAULT_COST)?)
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password, hash).unwrap_or(false)
}

pub fn create_token(user_id: i64, username: &str, secret: &str) -> anyhow::Result<String> {
    let now = chrono::Utc::now().timestamp() as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        username: username.to_string(),
        exp: now + 86400,
        iat: now,
    };
    Ok(encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?)
}

pub fn decode_token(token: &str, secret: &str) -> Option<Claims> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .ok()
    .map(|d| d.claims)
}

pub fn set_auth_cookie(jar: CookieJar, token: &str) -> CookieJar {
    let cookie = Cookie::build((COOKIE_NAME, token.to_string()))
        .http_only(true)
        .same_site(SameSite::Lax)
        .path("/")
        .max_age(cookie::time::Duration::days(1))
        .build();
    jar.add(cookie)
}

pub fn clear_auth_cookie(jar: CookieJar) -> CookieJar {
    let cookie = Cookie::build((COOKIE_NAME, ""))
        .http_only(true)
        .same_site(SameSite::Lax)
        .path("/")
        .max_age(cookie::time::Duration::seconds(0))
        .build();
    jar.add(cookie)
}

pub fn token_from_jar(jar: &CookieJar) -> Option<String> {
    jar.get(COOKIE_NAME).map(|c| c.value().to_string())
}

pub fn current_user(pool: &DbPool, jar: &CookieJar, secret: &str) -> Option<User> {
    let token = token_from_jar(jar)?;
    let claims = decode_token(&token, secret)?;
    let user_id: i64 = claims.sub.parse().ok()?;
    get_user_by_id(pool, user_id).ok()
}

pub fn get_user_by_id(pool: &DbPool, id: i64) -> anyhow::Result<User> {
    let conn = pool.get()?;
    let user = conn.query_row(
        "SELECT id, username, email, created_at FROM users WHERE id = ?1",
        [id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                email: row.get(2)?,
                created_at: row.get(3)?,
            })
        },
    )?;
    Ok(user)
}

pub fn get_user_by_username(pool: &DbPool, username: &str) -> anyhow::Result<(User, String)> {
    let conn = pool.get()?;
    let row = conn.query_row(
        "SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?1",
        [username],
        |row| {
            Ok((
                User {
                    id: row.get(0)?,
                    username: row.get(1)?,
                    email: row.get(2)?,
                    created_at: row.get(4)?,
                },
                row.get::<_, String>(3)?,
            ))
        },
    )?;
    Ok(row)
}

pub fn create_user(
    pool: &DbPool,
    username: &str,
    email: &str,
    password: &str,
) -> anyhow::Result<User> {
    let hash = hash_password(password)?;
    let conn = pool.get()?;
    conn.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?1, ?2, ?3)",
        rusqlite::params![username, email, hash],
    )?;
    let id = conn.last_insert_rowid();
    get_user_by_id(pool, id)
}

pub fn username_exists(pool: &DbPool, username: &str) -> anyhow::Result<bool> {
    let conn = pool.get()?;
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE username = ?1",
        [username],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

pub fn email_exists(pool: &DbPool, email: &str) -> anyhow::Result<bool> {
    let conn = pool.get()?;
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE email = ?1",
        [email],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

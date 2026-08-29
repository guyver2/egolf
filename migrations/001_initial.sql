-- 001_initial.sql
-- Initial schema for eGolf

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    seed TEXT NOT NULL,
    width INTEGER NOT NULL CHECK (width >= 5 AND width <= 100),
    height INTEGER NOT NULL CHECK (height >= 5 AND height <= 100),
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(width, height, seed)
);

CREATE TABLE IF NOT EXISTS hole_plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hole_id INTEGER NOT NULL REFERENCES holes(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    strokes INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hole_play_moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hole_play_id INTEGER NOT NULL REFERENCES hole_plays(id) ON DELETE CASCADE,
    move_order INTEGER NOT NULL,
    from_x INTEGER NOT NULL,
    from_y INTEGER NOT NULL,
    to_x INTEGER NOT NULL,
    to_y INTEGER NOT NULL
);

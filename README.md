# eGolf (Pixel Golf)

A digital adaptation of [Paper Apps Golf](https://gladdendesign.com/products/paper-apps-golf) by Tom Brinton.

Single Rust binary (Axum + Askama + SQLite) serving SSR pages and client-side game interactivity.

## Prerequisites

- Rust 1.75+ (toolchain 1.91 recommended)
- SQLite (bundled via `rusqlite`)

## Quick start

```bash
cp .env.example .env
make run
```

Open http://localhost:8080

## Commands

| Command | Description |
|---------|-------------|
| `make run` | Start dev server |
| `make test` | Run unit tests |
| `make migrate` | Apply SQL migrations |
| `make migrate-status` | Show migration status |
| `make docker-up` | Run in Docker |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP port |
| `DATABASE_PATH` | `egolf.db` | SQLite database file |
| `TERRAIN_CACHE_DIR` | `terrain_cache` | PNG thumbnail cache |
| `JWT_SECRET` | `dev-secret-change-me` | JWT signing key |
| `REGISTRATION_ENABLED` | `true` | Allow new signups |

## Architecture

- **Server**: Axum SSR with Askama templates
- **Game UI**: `assets/game.js` (dice, movement, map rendering)
- **Database**: SQLite with incremental SQL migrations in `migrations/`
- **Auth**: bcrypt passwords + JWT in httpOnly cookie

See [REQUIREMENTS.md](REQUIREMENTS.md) for the full feature specification.

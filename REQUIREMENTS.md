# eGolf — Requirements Specification

> **Living document.** Read this file before making any change to the project. Update it after every modification that adds, removes, or alters behaviour, APIs, data models, or deployment.

Last updated: 2026-08-29 (Rust rewrite)

## 1. Product overview

eGolf is a digital adaptation of [Paper Apps Golf](https://gladdendesign.com/products/paper-apps-golf) by Tom Brinton. Players roll dice to determine shot distance, move a ball across procedurally generated terrain, and try to reach the hole in as few strokes as possible.

**Stack**: single Rust binary at repo root — Axum + Askama (SSR) + SQLite + client-side `assets/game.js`.

---

## 2. User requirements

### 2.1 Core gameplay (all players, no account required)

| ID | Requirement |
|----|-------------|
| UR-G01 | On first visit to home (`/`), the game generates a **random 8-character alphanumeric seed** and loads a hole of default size **10×15**. |
| UR-G02 | The player **rolls a die** (click/tap) to obtain a random integer from 1 to the current die maximum. |
| UR-G03 | After rolling, **valid landing tiles** are highlighted. The player **clicks a highlighted tile** to move the ball there. |
| UR-G04 | Movement uses **8 directions** (N, NE, E, SE, S, SW, W, NW). Distance per direction is `ceil/floor(direction × roll)` from the ball's current tile. |
| UR-G05 | **Trees (`t`) and water (`w`) are impassable** — they cannot be landing targets. |
| UR-G06 | **Terrain type on the landing tile** determines the die for the *next* roll: **fairway → D8 (1–8)**, **grass → D6 (1–6)**, **sand → D2 (1–2)**. |
| UR-G07 | The player may use a **Putt** action for a **guaranteed roll of 1** (same flow as a normal roll). |
| UR-G08 | While a roll is unresolved (landing positions shown), the die is **locked**; it unlocks after a valid move. |
| UR-G09 | If a roll yields **no valid landing positions**, the stroke is **counted as wasted**, the player is prompted to roll again, and the die unlocks (`reboot` only). |
| UR-G10 | The hole is **won** when the ball reaches the hole tile. A congratulations overlay shows **stroke count** and **par**. |
| UR-G11 | **Par** is displayed during play and equals `floor(height / 5) + 1`. |
| UR-G12 | **Distance** (Manhattan) to the hole is displayed during play. |
| UR-G13 | The map is rendered as an **SVG grid** with colour-coded terrain, ball, start (magenta), and hole (black). |

### 2.2 Seed and hole variation (no account required)

| ID | Requirement |
|----|-------------|
| UR-S01 | The active **seed** is shown formatted as `XXXX-XXXX` and may be **edited** (8 alphanumeric chars; non-alphanumeric replaced with `0`, padded to 8). |
| UR-S02 | **Random** generates a new seed and reloads the terrain. |
| UR-S03 | **Retry** reloads the terrain for the **same seed** (re-rolls ball/hole placement via the same PRNG sequence). |
| UR-S04 | Terrain is **fully determined** by `(seed, width, height)` — identical inputs produce identical maps. |

### 2.3 Browsing and playing saved holes (no account required)

| ID | Requirement |
|----|-------------|
| UR-H01 | A **Holes** page lists saved holes with name, size, author, date, and a **terrain preview thumbnail**. |
| UR-H02 | Holes are **paginated** (20 per page). |
| UR-H03 | Each hole card offers **Play** and **Replays** actions. |
| UR-H04 | **Play** (`/play/hole/:id`) loads the saved hole's seed and dimensions and runs the standard game loop. Random/Save controls are hidden; play saving is enabled on completion. |
| UR-H05 | **Replays** (`/holes/:id/replays`) lists completed plays for that hole, sorted by **fewest strokes first** (best score leaderboard). |
| UR-H06 | Replay list shows rank, player name, stroke count, date, and a **Watch** link. |

### 2.4 Replay viewer (no account required)

| ID | Requirement |
|----|-------------|
| UR-R01 | **Replay** (`/replay/:id`) reconstructs the hole terrain and animates the ball along recorded moves. |
| UR-R02 | Playback controls: **reset, step back, play/pause, step forward**. |
| UR-R03 | Playback speed options: **0.5×, 1×, 2×, 4×**. |
| UR-R04 | The ball path up to the current step is drawn on the map. |

### 2.5 Account features (registration required)

| ID | Requirement |
|----|-------------|
| UR-A01 | Users can **sign up** with username, email, and password (password confirmation on client). |
| UR-A02 | Users can **log in** with username and password; session is a **JWT** in an **httpOnly cookie**. |
| UR-A03 | Users can **log out**; token is cleared. |
| UR-A04 | **Logged-in users** can **save a hole** from the home screen (name defaults to `Hole {seed}`). |
| UR-A05 | **Logged-in users** can **create a hole** via a dedicated form: name, seed, width (5–30 slider in UI), height (5–40 slider in UI), live preview, then **Save & Play**. |
| UR-A06 | On completing a hole, **logged-in users** may **save the play** (sequence of tile-to-tile moves). If the hole was not yet persisted, it is auto-saved first. |
| UR-A07 | **Profile** (`/profile`) lists the user's past plays with stroke count, date, and links to **Replay** and **Play Again**. |
| UR-A08 | Registration may be **disabled server-side** via `REGISTRATION_ENABLED=false` (returns 403 on signup). |

### 2.6 Navigation and layout

| ID | Requirement |
|----|-------------|
| UR-N01 | A fixed **top navigation bar** shows: logo/home, Holes, Create (auth), Profile (auth), Login/Sign Up or Logout. |
| UR-N02 | On viewports ≤768px, navigation collapses to a **hamburger menu**. |
| UR-N03 | Game controls sit in a **side panel** on desktop and a **fixed bottom bar** on mobile. |
| UR-N04 | The UI uses a **dark theme** throughout. |

---

## 3. System requirements

### 3.1 Architecture

| ID | Requirement |
|----|-------------|
| SR-A01 | **Backend**: Rust, Axum, raw SQLite (`rusqlite`), Askama templates (SSR). |
| SR-A02 | **Frontend**: server-rendered HTML + static `assets/game.js` / `assets/replay.js` / `assets/style.css`. |
| SR-A03 | **No separate API server**; HTML pages and a few JSON/form endpoints for game client (`/terrain/json`, `/game/save-*`). |
| SR-A04 | **Terrain generation runs on the server**; the client fetches map data via `/terrain/json`. |
| SR-A05 | **Game logic** (dice, landing positions, move validation) runs **client-side** in `assets/game.js`. |
| SR-A06 | Migrations run **automatically on startup** and via `make migrate`. |

### 3.2 Terrain generation

| ID | Requirement |
|----|-------------|
| SR-T01 | Input: `seed` (exactly 8 chars), `width` and `height` (5–100 inclusive). |
| SR-T02 | PRNG: `StdRng` seeded from the seed string (Rust-native; **not** byte-compatible with the former Python generator). |
| SR-T03 | Base fill: **grass**. Fairway blobs painted in top quarter (1), middle (`height/6` blobs), bottom quarter (2). |
| SR-T04 | Obstacles: `height/2` random blobs of sand (33%), trees (33%), or water (33%), size 10–20 tiles. |
| SR-T05 | Fairway/sand/water blobs undergo **dilate then erode**; tree blobs do not. |
| SR-T06 | **Ball** placed on fairway in bottom ~10% of map; **hole** on fairway in top ~10%. Fallback positions: ball `(1, h-2)`, hole `(w-2, 1)`. |
| SR-T07 | Neighbours (8-connected) of ball and hole are forced to **fairway**; ball and hole tiles themselves are **fairway**. |
| SR-T08 | Tile symbols: `g` grass, `f` fairway, `s` sand, `t` tree, `w` water. |
| SR-T09 | `/terrain/json` returns: `map`, `ball_position`, `hole_position`, `start_position`, `par`, `seed`, `width`, `height`. |

### 3.3 Terrain previews

| ID | Requirement |
|----|-------------|
| SR-P01 | `GET /terrain/preview` — cached PNG on disk (`terrain_cache/{seed}_{w}x{h}.png`), generated on first request or when a hole is saved. |
| SR-P02 | `GET /terrain/preview/draft` — in-memory PNG, not cached (used during hole creation). |
| SR-P03 | Preview colours match frontend SVG palette; start tile magenta, hole black; 6px per tile. |

### 3.4 Authentication

| ID | Requirement |
|----|-------------|
| SR-U01 | Passwords hashed with **bcrypt**. |
| SR-U02 | JWT signed with **HS256**; payload includes `sub` (user id), `username`, `exp`, `iat`. |
| SR-U03 | Token expiry: **24 hours**. |
| SR-U04 | Protected routes read JWT from **httpOnly cookie** `access_token`; unauthenticated users redirect to `/login`. |
| SR-U05 | Env: `JWT_SECRET` (required in production), `REGISTRATION_ENABLED` (default `true`). |

### 3.5 Data model (SQLite)

```
users
  id, username (unique), email (unique), password_hash, created_at

holes
  id, name, seed, width (5–100), height (5–100), author_id (nullable FK), created_at
  UNIQUE(width, height, seed)

hole_plays
  id, hole_id, user_id, strokes, created_at

hole_play_moves
  id, hole_play_id (CASCADE delete), move_order, from_x, from_y, to_x, to_y
```

| ID | Requirement |
|----|-------------|
| SR-D01 | A hole is uniquely identified by `(seed, width, height)`; duplicates return **409**. |
| SR-D02 | Stroke count on a play equals the **number of moves** submitted. |
| SR-D03 | Move coordinates are **grid indices** (x = column, y = row). |
| SR-D04 | Migration `002_wipe_game_data` removes all holes/plays/moves; **user accounts are preserved**. |

### 3.6 HTTP routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/` | No | Home — random hole game page |
| GET/POST | `/login` | No | Login form |
| GET/POST | `/signup` | No | Signup form (if registration enabled) |
| POST | `/logout` | No | Clear auth cookie |
| GET | `/holes` | No | Paginated hole list |
| GET/POST | `/create-hole` | Yes | Create hole form |
| GET | `/play/hole/{id}` | No | Play saved hole |
| GET | `/holes/{id}/replays` | No | Replays for a hole |
| GET | `/profile` | Yes | User profile and plays |
| GET | `/replay/{id}` | No | Replay viewer |
| GET | `/terrain/json` | No | Full terrain JSON |
| GET | `/terrain/preview` | No | Cached PNG |
| GET | `/terrain/preview/draft` | No | Uncached PNG |
| POST | `/game/save-hole` | Yes | Save new hole (JSON) |
| POST | `/game/save-play` | Yes | Save completed play (JSON) |

### 3.7 Deployment and operations

| ID | Requirement |
|----|-------------|
| SR-O01 | **Docker Compose** (`docker-compose.yml`): single `egolf` service (host `${PORT:-8080}` → container `8080`). |
| SR-O02 | Volumes: `db-data` (SQLite), `thumbnail-cache` (`terrain_cache`). |
| SR-O03 | **Makefile** targets: `build`, `run`, `test`, `migrate`, `migrate-status`, `docker-build`, `docker-up`, `docker-down`, `clean`. |
| SR-O04 | Env: `DATABASE_PATH` (default `./egolf.db`), `JWT_SECRET`, `REGISTRATION_ENABLED`, `TERRAIN_CACHE_DIR`, `PORT`. |
| SR-O05 | Static assets and templates are embedded/served by the Rust binary. |

---

## 4. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | **Responsive**: usable on desktop and mobile (breakpoints at 768px and 600px). |
| NFR-02 | **Accessibility**: interactive tiles and dice support keyboard (Enter); dice has `aria-label`. |
| NFR-03 | **Determinism**: same seed + dimensions → same terrain (Rust `StdRng` generator; not compatible with former Python output). |
| NFR-04 | **Pagination**: list endpoints support `page` (0-based) and `limit` (1–100, default 20). |

---

## 5. Out of scope / known gaps

- **Courses**: not implemented.
- **Slopes**: not generated or applied.
- **Hole deletion / editing**: not implemented.
- **Play deletion**: not implemented.
- **User profile editing**: not implemented.
- **Datastar SSE**: planned for interactive updates; current UI uses SSR + vanilla JS.

---

## 6. Maintenance protocol

### Before any change
1. Read this file in full.
2. Identify which requirement IDs are affected.

### After any change
1. Update affected requirement rows or add new IDs.
2. Update **§5 Out of scope** if a gap is closed or a new one is introduced.
3. Set **Last updated** date at the top.
4. Add a line to the changelog below.

### Changelog

| Date | Change |
|------|--------|
| 2026-08-29 | Full rewrite to Rust + Axum + Askama SSR; removed Vue/Python/SvelteKit stacks. |
| 2026-08-29 | Initial requirements derived from full codebase audit (reboot + legacy SvelteKit). |

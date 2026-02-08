# eGolf (Pixel Golf) — Reboot

A digital adaptation of Paper Apps Golf by Tom Brinton, rebuilt with a Python/FastAPI backend and Vue.js 3 frontend.

## Architecture

- **Backend**: Python 3 + FastAPI + raw SQLite (no ORM) with incremental SQL migrations
- **Frontend**: Vue 3 + TypeScript + Pinia + Vue Router, with Vite as the build tool

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Setup

### Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python migrate.py

# Start the dev server
uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. You can view the auto-generated docs at `http://localhost:8000/docs`.

**Environment variables** (optional):
- `DATABASE_PATH` — path to the SQLite database file (default: `./egolf.db`)
- `JWT_SECRET` — secret key for signing JWT tokens (default: `dev-secret-change-me`)

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (proxies /api to backend on port 8000)
npm run dev
```

The frontend is available at `http://localhost:5173`.

## How to Play

1. Open `http://localhost:5173` — a random hole is generated
2. **Roll the dice** by clicking it. The number determines how far the ball can travel
3. **Click a highlighted tile** to move the ball to that position
4. Terrain affects your next roll:
   - **Fairway** (bright green): D8 (1-8)
   - **Grass** (dark green): D6 (1-6)
   - **Sand** (orange): D2 (1-2)
   - **Water** (blue) and **Trees** (gray) are impassable
5. Use the **Putt** button for a guaranteed roll of 1
6. Reach the hole to win!

## Features

- Procedural terrain generation from 8-character seeds
- User accounts with signup/login (JWT auth)
- Save and browse holes
- Play saved holes
- Automatic play recording for logged-in users
- Step-by-step animated replay of past plays
- Responsive design (desktop + mobile)

## Project Structure

```
reboot/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── db.py                # SQLite connection helper
│   ├── auth.py              # JWT + password hashing
│   ├── schemas.py           # Pydantic models
│   ├── migrate.py           # Migration runner
│   ├── migrations/          # Incremental SQL migrations
│   │   └── 001_initial.sql
│   ├── routes/
│   │   ├── auth.py          # Signup, login, me
│   │   ├── holes.py         # CRUD for holes
│   │   └── holeplays.py     # CRUD for hole plays
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api.ts            # HTTP client with auth
    │   ├── lib/
    │   │   ├── terrain.ts    # Terrain generation engine
    │   │   └── dice.ts       # Dice logic
    │   ├── stores/
    │   │   ├── auth.ts       # Auth state (Pinia)
    │   │   └── game.ts       # Game state (Pinia)
    │   ├── components/
    │   │   ├── GameMap.vue   # SVG terrain renderer
    │   │   ├── DiceRoller.vue
    │   │   ├── HoleInfo.vue
    │   │   ├── NavBar.vue
    │   │   └── ReplayMap.vue # SVG replay renderer
    │   └── views/
    │       ├── HomeView.vue
    │       ├── LoginView.vue
    │       ├── SignupView.vue
    │       ├── HolesView.vue
    │       ├── PlayHoleView.vue
    │       ├── ProfileView.vue
    │       └── ReplayView.vue
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## API Endpoints

| Method | Path                          | Auth | Description                  |
| ------ | ----------------------------- | ---- | ---------------------------- |
| POST   | `/api/auth/signup`            | No   | Create account               |
| POST   | `/api/auth/login`             | No   | Get JWT token                |
| GET    | `/api/auth/me`                | Yes  | Current user info            |
| GET    | `/api/holes?page=0&limit=20`  | No   | List holes (paginated)       |
| GET    | `/api/holes/{id}`             | No   | Get hole by ID               |
| POST   | `/api/holes`                  | Yes  | Create hole                  |
| GET    | `/api/holeplays`              | No   | List plays (filterable)      |
| GET    | `/api/holeplays/{id}`         | No   | Get play with moves          |
| POST   | `/api/holeplays`              | Yes  | Save a completed play        |

## Adding Database Migrations

1. Create a new file in `backend/migrations/` following the naming convention: `NNN_description.sql` (e.g., `002_add_courses.sql`)
2. Write your SQL statements
3. Run `python migrate.py` — it will automatically apply only the new migration
4. Check status with `python migrate.py --status`

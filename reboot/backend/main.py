from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from migrate import run_all as run_migrations
from routes import auth, holes, holeplays


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run pending migrations on startup
    run_migrations()
    yield


app = FastAPI(title="eGolf API", version="0.1.0", lifespan=lifespan)

# CORS — allow the Vue dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(holes.router, prefix="/api/holes", tags=["holes"])
app.include_router(holeplays.router, prefix="/api/holeplays", tags=["holeplays"])


@app.get("/api/health")
def health():
    return {"status": "ok"}

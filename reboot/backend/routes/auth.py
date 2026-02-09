import os

from fastapi import APIRouter, HTTPException, Depends, status
from schemas import SignupRequest, LoginRequest, UserResponse, TokenResponse
from auth import hash_password, verify_password, create_access_token, require_user
from db import get_db

REGISTRATION_ENABLED = os.environ.get("REGISTRATION_ENABLED", "true").lower() in ("true", "1", "yes")

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest):
    if not REGISTRATION_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently disabled",
        )
    with get_db() as conn:
        # Check if username already exists
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ?", (req.username,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

        # Check if email already exists
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (req.email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        password_hash = hash_password(req.password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (req.username, req.email, password_hash),
        )
        user_id = cursor.lastrowid

        user = conn.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    return UserResponse(**dict(user))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    with get_db() as conn:
        user = conn.execute(
            "SELECT id, username, email, password_hash FROM users WHERE username = ?",
            (req.username,),
        ).fetchone()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(user["id"], user["username"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(user: dict = Depends(require_user)):
    return UserResponse(**user)

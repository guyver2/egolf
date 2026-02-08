from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# --- Auth ---

class SignupRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=1)


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Holes ---

class HoleCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    seed: str = Field(min_length=8, max_length=8)
    width: int = Field(ge=5, le=100)
    height: int = Field(ge=5, le=100)


class HoleResponse(BaseModel):
    id: int
    name: str
    seed: str
    width: int
    height: int
    author_id: Optional[int]
    author_name: Optional[str] = None
    created_at: str


class HoleListResponse(BaseModel):
    holes: list[HoleResponse]
    total: int
    page: int
    limit: int
    pages: int


# --- Hole Plays ---

class MoveData(BaseModel):
    from_x: int
    from_y: int
    to_x: int
    to_y: int


class HolePlayCreateRequest(BaseModel):
    hole_id: int
    moves: list[MoveData]


class MoveResponse(BaseModel):
    id: int
    move_order: int
    from_x: int
    from_y: int
    to_x: int
    to_y: int


class HolePlayResponse(BaseModel):
    id: int
    hole_id: int
    user_id: int
    strokes: int
    created_at: str
    user_name: Optional[str] = None
    hole_name: Optional[str] = None
    hole_seed: Optional[str] = None
    hole_width: Optional[int] = None
    hole_height: Optional[int] = None
    moves: list[MoveResponse] = []


class HolePlayListResponse(BaseModel):
    hole_plays: list[HolePlayResponse]
    total: int
    page: int
    limit: int
    pages: int

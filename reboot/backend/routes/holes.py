import math
from fastapi import APIRouter, HTTPException, Depends, Query, status
from schemas import HoleCreateRequest, HoleResponse, HoleListResponse
from auth import require_user
from db import get_db
from routes.terrain import save_terrain_thumbnail

router = APIRouter()


def _row_to_hole_response(row) -> HoleResponse:
    d = dict(row)
    return HoleResponse(
        id=d["id"],
        name=d["name"],
        seed=d["seed"],
        width=d["width"],
        height=d["height"],
        author_id=d["author_id"],
        author_name=d.get("author_name"),
        created_at=str(d["created_at"]),
    )


@router.get("", response_model=HoleListResponse)
def list_holes(page: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100)):
    offset = page * limit
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT h.id, h.name, h.seed, h.width, h.height, h.author_id, h.created_at,
                   u.username AS author_name
            FROM holes h
            LEFT JOIN users u ON h.author_id = u.id
            ORDER BY h.created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()

        total = conn.execute("SELECT COUNT(*) AS cnt FROM holes").fetchone()["cnt"]

    return HoleListResponse(
        holes=[_row_to_hole_response(r) for r in rows],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.get("/{hole_id}", response_model=HoleResponse)
def get_hole(hole_id: int):
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT h.id, h.name, h.seed, h.width, h.height, h.author_id, h.created_at,
                   u.username AS author_name
            FROM holes h
            LEFT JOIN users u ON h.author_id = u.id
            WHERE h.id = ?
            """,
            (hole_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hole not found")

    return _row_to_hole_response(row)


@router.post("", response_model=HoleResponse, status_code=status.HTTP_201_CREATED)
def create_hole(req: HoleCreateRequest, user: dict = Depends(require_user)):
    with get_db() as conn:
        # Check for duplicate seed+width+height
        existing = conn.execute(
            "SELECT id FROM holes WHERE seed = ? AND width = ? AND height = ?",
            (req.seed, req.width, req.height),
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A hole with this seed and dimensions already exists",
            )

        cursor = conn.execute(
            "INSERT INTO holes (name, seed, width, height, author_id) VALUES (?, ?, ?, ?, ?)",
            (req.name, req.seed, req.width, req.height, user["id"]),
        )
        hole_id = cursor.lastrowid

        row = conn.execute(
            """
            SELECT h.id, h.name, h.seed, h.width, h.height, h.author_id, h.created_at,
                   u.username AS author_name
            FROM holes h
            LEFT JOIN users u ON h.author_id = u.id
            WHERE h.id = ?
            """,
            (hole_id,),
        ).fetchone()

    # Persist the terrain thumbnail to disk now that the hole is saved
    save_terrain_thumbnail(req.seed, req.width, req.height)

    return _row_to_hole_response(row)

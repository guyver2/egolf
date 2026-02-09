import math
from fastapi import APIRouter, HTTPException, Depends, Query, status
from schemas import (
    HolePlayCreateRequest,
    HolePlayResponse,
    HolePlayListResponse,
    MoveResponse,
)
from auth import require_user
from db import get_db

router = APIRouter()


def _build_hole_play_response(conn, play_row) -> HolePlayResponse:
    d = dict(play_row)
    moves = conn.execute(
        """
        SELECT id, move_order, from_x, from_y, to_x, to_y
        FROM hole_play_moves
        WHERE hole_play_id = ?
        ORDER BY move_order
        """,
        (d["id"],),
    ).fetchall()

    return HolePlayResponse(
        id=d["id"],
        hole_id=d["hole_id"],
        user_id=d["user_id"],
        strokes=d["strokes"],
        created_at=str(d["created_at"]),
        user_name=d.get("user_name"),
        hole_name=d.get("hole_name"),
        hole_seed=d.get("hole_seed"),
        hole_width=d.get("hole_width"),
        hole_height=d.get("hole_height"),
        moves=[MoveResponse(**dict(m)) for m in moves],
    )


PLAY_JOIN_QUERY = """
    SELECT hp.id, hp.hole_id, hp.user_id, hp.strokes, hp.created_at,
           u.username AS user_name,
           h.name AS hole_name, h.seed AS hole_seed,
           h.width AS hole_width, h.height AS hole_height
    FROM hole_plays hp
    JOIN users u ON hp.user_id = u.id
    JOIN holes h ON hp.hole_id = h.id
"""


ALLOWED_SORT = {
    "recent": "hp.created_at DESC",
    "best": "hp.strokes ASC, hp.created_at ASC",
}


@router.get("", response_model=HolePlayListResponse)
def list_hole_plays(
    page: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: int | None = None,
    hole_id: int | None = None,
    sort: str = Query("recent"),
):
    order_clause = ALLOWED_SORT.get(sort, ALLOWED_SORT["recent"])
    offset = page * limit
    conditions = []
    params: list = []

    if user_id is not None:
        conditions.append("hp.user_id = ?")
        params.append(user_id)
    if hole_id is not None:
        conditions.append("hp.hole_id = ?")
        params.append(hole_id)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    with get_db() as conn:
        rows = conn.execute(
            f"""
            {PLAY_JOIN_QUERY}
            {where_clause}
            ORDER BY {order_clause}
            LIMIT ? OFFSET ?
            """,
            params + [limit, offset],
        ).fetchall()

        count_query = f"SELECT COUNT(*) AS cnt FROM hole_plays hp {where_clause}"
        total = conn.execute(count_query, params).fetchone()["cnt"]

        plays = [_build_hole_play_response(conn, r) for r in rows]

    return HolePlayListResponse(
        hole_plays=plays,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.get("/{play_id}", response_model=HolePlayResponse)
def get_hole_play(play_id: int):
    with get_db() as conn:
        row = conn.execute(
            f"{PLAY_JOIN_QUERY} WHERE hp.id = ?",
            (play_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hole play not found",
            )

        return _build_hole_play_response(conn, row)


@router.post("", response_model=HolePlayResponse, status_code=status.HTTP_201_CREATED)
def create_hole_play(req: HolePlayCreateRequest, user: dict = Depends(require_user)):
    with get_db() as conn:
        # Verify the hole exists
        hole = conn.execute("SELECT id FROM holes WHERE id = ?", (req.hole_id,)).fetchone()
        if hole is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hole not found",
            )

        stroke_count = len(req.moves)
        cursor = conn.execute(
            "INSERT INTO hole_plays (hole_id, user_id, strokes) VALUES (?, ?, ?)",
            (req.hole_id, user["id"], stroke_count),
        )
        play_id = cursor.lastrowid

        for i, move in enumerate(req.moves):
            conn.execute(
                """
                INSERT INTO hole_play_moves (hole_play_id, move_order, from_x, from_y, to_x, to_y)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (play_id, i, move.from_x, move.from_y, move.to_x, move.to_y),
            )

        row = conn.execute(
            f"{PLAY_JOIN_QUERY} WHERE hp.id = ?",
            (play_id,),
        ).fetchone()

        return _build_hole_play_response(conn, row)

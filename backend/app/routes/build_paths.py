import json
from fastapi import APIRouter, HTTPException
from app.db.connection import get_db, fetchall_dict, fetchone_dict
from typing import Optional

router = APIRouter()


def _parse_build_path(row: dict) -> dict:
    """Parse steps JSON and return a clean dict."""
    row["steps"] = json.loads(row["steps"]) if row.get("steps") else []
    return row


@router.get("/")
async def get_build_paths(category: Optional[str] = None, limit: int = 20):
    """Get all build paths with optional filtering."""
    db = get_db()

    if category:
        cur = db.execute(
            """SELECT bp.*, t.title as template_title
               FROM build_paths bp
               LEFT JOIN templates t ON bp.template_id = t.id
               WHERE bp.category = ?
               ORDER BY bp.created_at DESC LIMIT ?""",
            (category, limit),
        )
    else:
        cur = db.execute(
            """SELECT bp.*, t.title as template_title
               FROM build_paths bp
               LEFT JOIN templates t ON bp.template_id = t.id
               ORDER BY bp.created_at DESC LIMIT ?""",
            (limit,),
        )

    return [_parse_build_path(r) for r in fetchall_dict(cur)]


@router.get("/{build_path_id}")
async def get_build_path(build_path_id: int):
    """Get a specific build path by ID."""
    db = get_db()
    cur = db.execute(
        """SELECT bp.*, t.title as template_title, t.stack as template_stack
           FROM build_paths bp
           LEFT JOIN templates t ON bp.template_id = t.id
           WHERE bp.id = ?""",
        (build_path_id,),
    )
    row = fetchone_dict(cur)

    if not row:
        raise HTTPException(status_code=404, detail="Build path not found")

    return _parse_build_path(row)

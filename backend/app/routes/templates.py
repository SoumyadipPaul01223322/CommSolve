from fastapi import APIRouter, HTTPException
from app.db.connection import get_db, fetchall_dict, fetchone_dict
from app.models.schemas import TemplateCreate, TemplateResponse
from typing import List, Optional

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
async def get_templates(category: Optional[str] = None, limit: int = 20):
    """Get all templates with optional filtering."""
    db = get_db()

    if category:
        cur = db.execute(
            "SELECT * FROM templates WHERE category = ? ORDER BY usage_count DESC, created_at DESC LIMIT ?",
            (category, limit),
        )
    else:
        cur = db.execute(
            "SELECT * FROM templates ORDER BY usage_count DESC, created_at DESC LIMIT ?",
            (limit,),
        )

    return [TemplateResponse(**r) for r in fetchall_dict(cur)]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: int):
    """Get a specific template by ID."""
    db = get_db()
    cur = db.execute("SELECT * FROM templates WHERE id = ?", (template_id,))
    row = fetchone_dict(cur)

    if not row:
        raise HTTPException(status_code=404, detail="Template not found")

    db.execute(
        "UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?",
        (template_id,),
    )
    db.commit()

    return TemplateResponse(**row)


@router.post("/", response_model=TemplateResponse)
async def create_template(template: TemplateCreate):
    """Create a new template."""
    db = get_db()

    try:
        db.execute(
            """INSERT INTO templates (title, description, category, difficulty, stack, author_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (template.title, template.description, template.category,
             template.difficulty, template.stack, template.author_id),
        )
        db.commit()

        cur = db.execute("SELECT * FROM templates ORDER BY id DESC LIMIT 1")
        row = fetchone_dict(cur)

        return TemplateResponse(**row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

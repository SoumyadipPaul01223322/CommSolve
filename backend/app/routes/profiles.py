import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.db.connection import get_db, fetchone_dict, fetchall_dict

logger = logging.getLogger(__name__)
router = APIRouter()


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    picture: Optional[str] = None
    bio: Optional[str] = None
    is_technical: Optional[bool] = None
    domains: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    website: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None


@router.get("/{user_id}")
async def get_profile(user_id: str):
    """Get user profile. Creates one if it doesn't exist."""
    db = get_db()
    cur = db.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    row = fetchone_dict(cur)

    if not row:
        return {
            "user_id": user_id, "name": "", "email": "", "picture": "",
            "bio": "", "is_technical": False, "domains": [], "skills": [],
            "location": "", "website": "", "github": "", "linkedin": "",
            "questions_count": 0, "answers_count": 0, "reputation": 0,
        }

    # Parse JSON fields
    result = dict(row)
    for f in ("domains", "skills"):
        try:
            result[f] = json.loads(result.get(f) or "[]")
        except Exception:
            result[f] = []
    result["is_technical"] = bool(result.get("is_technical", 0))

    # Live counts
    cur_q = db.execute("SELECT COUNT(*) as cnt FROM questions WHERE user_id = ?", (user_id,))
    cur_a = db.execute("SELECT COUNT(*) as cnt FROM answers WHERE user_id = ? AND is_ai_generated = 0", (user_id,))
    q_row = fetchone_dict(cur_q)
    a_row = fetchone_dict(cur_a)
    result["questions_count"] = q_row["cnt"] if q_row else 0
    result["answers_count"] = a_row["cnt"] if a_row else 0

    # Groups
    cur_g = db.execute(
        """SELECT g.id, g.name, g.icon, g.color FROM group_members gm
           JOIN groups g ON g.id = gm.group_id WHERE gm.user_id = ?""",
        (user_id,),
    )
    result["groups"] = fetchall_dict(cur_g)

    return result


@router.put("/{user_id}")
async def update_profile(user_id: str, profile: ProfileUpdate):
    """Create or update user profile."""
    db = get_db()

    cur = db.execute("SELECT user_id FROM profiles WHERE user_id = ?", (user_id,))
    exists = fetchone_dict(cur)

    domains_json = json.dumps(profile.domains) if profile.domains is not None else "[]"
    skills_json = json.dumps(profile.skills) if profile.skills is not None else "[]"

    if exists:
        db.execute(
            """UPDATE profiles SET name=?, email=?, picture=?, bio=?,
               is_technical=?, domains=?, skills=?, location=?,
               website=?, github=?, linkedin=?, updated_at=CURRENT_TIMESTAMP
               WHERE user_id=?""",
            (profile.name or "", profile.email or "", profile.picture or "",
             profile.bio or "", int(profile.is_technical or False),
             domains_json, skills_json, profile.location or "",
             profile.website or "", profile.github or "", profile.linkedin or "",
             user_id),
        )
    else:
        db.execute(
            """INSERT INTO profiles (user_id, name, email, picture, bio,
               is_technical, domains, skills, location, website, github, linkedin)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, profile.name or "", profile.email or "", profile.picture or "",
             profile.bio or "", int(profile.is_technical or False),
             domains_json, skills_json, profile.location or "",
             profile.website or "", profile.github or "", profile.linkedin or ""),
        )

    db.commit()
    return {"message": "Profile updated"}

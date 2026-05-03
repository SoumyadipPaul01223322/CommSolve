import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from app.db.connection import get_db, fetchall_dict, fetchone_dict

logger = logging.getLogger(__name__)
router = APIRouter()


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: str = ""
    category: str = "General"
    icon: str = "💬"
    color: str = "purple"
    creator_id: str = ""
    creator_name: str = ""
    creator_picture: str = ""


class GroupMessageCreate(BaseModel):
    user_id: str
    user_name: str = ""
    user_picture: str = ""
    content: str = Field(..., min_length=1)


# ─── Groups CRUD ──────────────────────────────────────
@router.get("/")
async def list_groups(user_id: Optional[str] = None):
    """List all public groups with membership status for user."""
    db = get_db()
    cur = db.execute("SELECT * FROM groups WHERE is_public = 1 ORDER BY member_count DESC")
    groups = fetchall_dict(cur)

    if user_id:
        cur_m = db.execute("SELECT group_id FROM group_members WHERE user_id = ?", (user_id,))
        joined_ids = {r["group_id"] for r in fetchall_dict(cur_m)}
        for g in groups:
            g["is_member"] = g["id"] in joined_ids
    else:
        for g in groups:
            g["is_member"] = False

    return groups


@router.post("/")
async def create_group(group: GroupCreate):
    """Create a new group."""
    db = get_db()
    db.execute(
        """INSERT INTO groups (name, description, category, icon, color, creator_id, member_count)
           VALUES (?, ?, ?, ?, ?, ?, 1)""",
        (group.name, group.description, group.category, group.icon, group.color, group.creator_id),
    )
    db.commit()

    cur = db.execute("SELECT * FROM groups ORDER BY id DESC LIMIT 1")
    row = fetchone_dict(cur)

    # Auto-join creator
    if group.creator_id:
        db.execute(
            "INSERT INTO group_members (group_id, user_id, user_name, user_picture, role) VALUES (?, ?, ?, ?, 'admin')",
            (row["id"], group.creator_id, group.creator_name, group.creator_picture),
        )
        db.commit()

    return row


@router.get("/{group_id}")
async def get_group(group_id: int):
    """Get group details with members."""
    db = get_db()
    cur = db.execute("SELECT * FROM groups WHERE id = ?", (group_id,))
    group = fetchone_dict(cur)
    if not group:
        raise HTTPException(404, "Group not found")

    cur_m = db.execute(
        "SELECT * FROM group_members WHERE group_id = ? ORDER BY joined_at ASC",
        (group_id,),
    )
    group["members"] = fetchall_dict(cur_m)
    return group


# ─── Join / Leave ─────────────────────────────────────
@router.post("/{group_id}/join")
async def join_group(group_id: int, user_id: str, user_name: str = "", user_picture: str = ""):
    """Join a group."""
    db = get_db()

    cur = db.execute(
        "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
        (group_id, user_id),
    )
    if fetchone_dict(cur):
        return {"message": "Already a member"}

    db.execute(
        "INSERT INTO group_members (group_id, user_id, user_name, user_picture) VALUES (?, ?, ?, ?)",
        (group_id, user_id, user_name, user_picture),
    )
    db.execute("UPDATE groups SET member_count = member_count + 1 WHERE id = ?", (group_id,))
    db.commit()
    return {"message": "Joined group"}


@router.delete("/{group_id}/leave/{user_id}")
async def leave_group(group_id: int, user_id: str):
    """Leave a group."""
    db = get_db()
    db.execute(
        "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
        (group_id, user_id),
    )
    db.execute(
        "UPDATE groups SET member_count = CASE WHEN member_count > 0 THEN member_count - 1 ELSE 0 END WHERE id = ?",
        (group_id,),
    )
    db.commit()
    return {"message": "Left group"}


# ─── Group Messages ──────────────────────────────────
@router.get("/{group_id}/messages")
async def get_group_messages(group_id: int, limit: int = 50):
    """Get recent messages in a group."""
    db = get_db()
    cur = db.execute(
        "SELECT * FROM group_messages WHERE group_id = ? ORDER BY created_at DESC LIMIT ?",
        (group_id, limit),
    )
    rows = fetchall_dict(cur)
    rows.reverse()
    return rows


@router.post("/{group_id}/messages")
async def send_group_message(group_id: int, msg: GroupMessageCreate):
    """Send a message to a group channel."""
    db = get_db()

    # Verify membership
    cur = db.execute(
        "SELECT id FROM group_members WHERE group_id = ? AND user_id = ?",
        (group_id, msg.user_id),
    )
    if not fetchone_dict(cur):
        raise HTTPException(403, "You must join this group to send messages")

    db.execute(
        "INSERT INTO group_messages (group_id, user_id, user_name, user_picture, content) VALUES (?, ?, ?, ?, ?)",
        (group_id, msg.user_id, msg.user_name, msg.user_picture, msg.content),
    )
    db.commit()

    cur = db.execute("SELECT * FROM group_messages ORDER BY id DESC LIMIT 1")
    return fetchone_dict(cur)

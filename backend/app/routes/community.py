import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.db.connection import get_db, fetchall_dict, fetchone_dict
from app.routes.notifications import create_notification

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Schemas ──────────────────────────────────────────
class ConnectRequest(BaseModel):
    from_user_id: str
    from_user_name: str = ""
    from_user_picture: str = ""
    to_user_id: str
    to_user_name: str = ""
    to_user_picture: str = ""


class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    content: str
    read: int = 0
    created_at: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: int
    from_user_id: str
    from_user_name: Optional[str] = None
    from_user_picture: Optional[str] = None
    to_user_id: str
    to_user_name: Optional[str] = None
    to_user_picture: Optional[str] = None
    status: str = "pending"
    created_at: Optional[str] = None


# ─── Connections ──────────────────────────────────────
@router.post("/connect")
async def send_connection(req: ConnectRequest):
    """Send a connection request."""
    db = get_db()

    # Check if connection already exists in either direction
    cur = db.execute(
        """SELECT id, status FROM connections
           WHERE (from_user_id = ? AND to_user_id = ?)
              OR (from_user_id = ? AND to_user_id = ?)""",
        (req.from_user_id, req.to_user_id, req.to_user_id, req.from_user_id),
    )
    existing = fetchone_dict(cur)
    if existing:
        if existing["status"] == "accepted":
            return {"message": "Already connected"}
        return {"message": "Connection request already pending"}

    db.execute(
        """INSERT INTO connections (from_user_id, from_user_name, from_user_picture,
           to_user_id, to_user_name, to_user_picture, status)
           VALUES (?, ?, ?, ?, ?, ?, 'pending')""",
        (req.from_user_id, req.from_user_name, req.from_user_picture,
         req.to_user_id, req.to_user_name, req.to_user_picture),
    )
    db.commit()

    create_notification(
        req.to_user_id, "connection_request",
        f"{req.from_user_name or 'Someone'} wants to connect",
        "You have a new connection request",
        "/community"
    )

    return {"message": "Connection request sent"}


@router.put("/connect/{connection_id}/accept")
async def accept_connection(connection_id: int):
    """Accept a connection request."""
    db = get_db()
    cur = db.execute("SELECT * FROM connections WHERE id = ?", (connection_id,))
    conn = fetchone_dict(cur)
    db.execute("UPDATE connections SET status = 'accepted' WHERE id = ?", (connection_id,))
    db.commit()

    if conn:
        create_notification(
            conn["from_user_id"], "connection_accepted",
            f"{conn.get('to_user_name', 'Someone')} accepted your connection",
            "You are now connected!",
            "/community"
        )

    return {"message": "Connection accepted"}


@router.delete("/connect/{connection_id}")
async def remove_connection(connection_id: int):
    """Remove/reject a connection."""
    db = get_db()
    db.execute("DELETE FROM connections WHERE id = ?", (connection_id,))
    db.commit()
    return {"message": "Connection removed"}


@router.get("/connections/{user_id}", response_model=List[ConnectionResponse])
async def get_connections(user_id: str):
    """Get all connections for a user."""
    db = get_db()
    cur = db.execute(
        """SELECT * FROM connections
           WHERE (from_user_id = ? OR to_user_id = ?)
           ORDER BY created_at DESC""",
        (user_id, user_id),
    )
    return [ConnectionResponse(**r) for r in fetchall_dict(cur)]


# ─── Messages (Chat) ─────────────────────────────────
@router.post("/messages", response_model=MessageResponse)
async def send_message(msg: MessageCreate):
    """Send a message to a connected user."""
    db = get_db()

    # Verify connection exists and is accepted
    cur = db.execute(
        """SELECT id FROM connections
           WHERE status = 'accepted'
             AND ((from_user_id = ? AND to_user_id = ?)
               OR (from_user_id = ? AND to_user_id = ?))""",
        (msg.sender_id, msg.receiver_id, msg.receiver_id, msg.sender_id),
    )
    if not fetchone_dict(cur):
        raise HTTPException(status_code=403, detail="You must be connected to send messages")

    db.execute(
        "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
        (msg.sender_id, msg.receiver_id, msg.content),
    )
    db.commit()

    cur = db.execute("SELECT * FROM messages ORDER BY id DESC LIMIT 1")
    row = fetchone_dict(cur)
    return MessageResponse(**row)


@router.get("/messages/{user_id}/{other_id}", response_model=List[MessageResponse])
async def get_messages(user_id: str, other_id: str):
    """Get chat messages between two users."""
    db = get_db()
    cur = db.execute(
        """SELECT * FROM messages
           WHERE (sender_id = ? AND receiver_id = ?)
              OR (sender_id = ? AND receiver_id = ?)
           ORDER BY created_at ASC""",
        (user_id, other_id, other_id, user_id),
    )
    return [MessageResponse(**r) for r in fetchall_dict(cur)]


@router.get("/people/{user_id}")
async def get_community_members(user_id: str):
    """Get all community members with connection status for current user."""
    db = get_db()

    # Get all answer authors (community members who have participated)
    cur = db.execute(
        """SELECT DISTINCT user_id FROM answers WHERE user_id IS NOT NULL AND user_id != ''
           UNION
           SELECT DISTINCT user_id FROM questions WHERE user_id IS NOT NULL AND user_id != ''"""
    )
    member_ids = [r["user_id"] for r in fetchall_dict(cur) if r["user_id"] != user_id]

    # Get connections for this user
    cur = db.execute(
        """SELECT * FROM connections
           WHERE from_user_id = ? OR to_user_id = ?""",
        (user_id, user_id),
    )
    connections = fetchall_dict(cur)

    conn_map = {}
    for c in connections:
        other = c["to_user_id"] if c["from_user_id"] == user_id else c["from_user_id"]
        conn_map[other] = {"id": c["id"], "status": c["status"],
                           "name": c["to_user_name"] if c["from_user_id"] == user_id else c["from_user_name"],
                           "picture": c["to_user_picture"] if c["from_user_id"] == user_id else c["from_user_picture"]}

    members = []
    for mid in member_ids:
        conn = conn_map.get(mid)
        members.append({
            "user_id": mid,
            "name": conn["name"] if conn else f"Member {mid[:6]}",
            "picture": conn.get("picture", "") if conn else "",
            "connection": conn,
        })

    return members

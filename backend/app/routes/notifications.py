import logging
from fastapi import APIRouter
from app.db.connection import get_db, fetchall_dict

logger = logging.getLogger(__name__)
router = APIRouter()


def create_notification(user_id: str, type: str, title: str, message: str = "", link: str = ""):
    """Helper to create a notification (call from other routes)."""
    try:
        db = get_db()
        db.execute(
            "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
            (user_id, type, title, message, link),
        )
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create notification: {e}")


@router.get("/{user_id}")
async def get_notifications(user_id: str, limit: int = 20):
    """Get recent notifications for a user."""
    db = get_db()
    cur = db.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit),
    )
    return fetchall_dict(cur)


@router.put("/{user_id}/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read."""
    db = get_db()
    db.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    db.commit()
    return {"message": "All notifications marked as read"}


@router.put("/{notification_id}/read")
async def mark_read(notification_id: int):
    """Mark a single notification as read."""
    db = get_db()
    db.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    db.commit()
    return {"message": "Notification marked as read"}


@router.get("/{user_id}/unread-count")
async def unread_count(user_id: str):
    """Get count of unread notifications."""
    db = get_db()
    cur = db.execute(
        "SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0",
        (user_id,),
    )
    from app.db.connection import fetchone_dict
    row = fetchone_dict(cur)
    return {"count": row["cnt"] if row else 0}

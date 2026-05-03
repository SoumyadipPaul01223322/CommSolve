import os
import json
import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.connection import get_db, fetchone_dict

logger = logging.getLogger("commsolve.auth")

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")


class TokenExchangeRequest(BaseModel):
    code: str
    redirect_uri: str | None = None


class AdminVerifyRequest(BaseModel):
    password: str


@router.post("/admin/verify")
async def verify_admin_password(body: AdminVerifyRequest):
    """Verify admin password. Returns success or 401."""
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=500, detail="Admin password not configured")
    if body.password != ADMIN_PASSWORD:
        logger.warning("Failed admin login attempt")
        raise HTTPException(status_code=401, detail="Invalid admin password")
    logger.info("Admin password verified successfully")
    return {"verified": True}


@router.get("/admin/stats")
async def get_admin_stats():
    """Get comprehensive admin dashboard stats from real data."""
    db = get_db()

    # Counts
    q_cur = db.execute("SELECT COUNT(*) as cnt FROM questions")
    q_count = fetchone_dict(q_cur)["cnt"]

    q_open = db.execute("SELECT COUNT(*) as cnt FROM questions WHERE status != 'solved'")
    open_count = fetchone_dict(q_open)["cnt"]

    q_solved = db.execute("SELECT COUNT(*) as cnt FROM questions WHERE status = 'solved'")
    solved_count = fetchone_dict(q_solved)["cnt"]

    t_cur = db.execute("SELECT COUNT(*) as cnt FROM templates")
    t_count = fetchone_dict(t_cur)["cnt"]

    bp_cur = db.execute("SELECT COUNT(*) as cnt FROM build_paths")
    bp_count = fetchone_dict(bp_cur)["cnt"]

    a_cur = db.execute("SELECT COUNT(*) as cnt FROM answers")
    a_count = fetchone_dict(a_cur)["cnt"]

    ai_cur = db.execute("SELECT COUNT(*) as cnt FROM answers WHERE is_ai_generated = 1")
    ai_count = fetchone_dict(ai_cur)["cnt"]

    community_cur = db.execute("SELECT COUNT(*) as cnt FROM answers WHERE is_ai_generated = 0")
    community_a = fetchone_dict(community_cur)["cnt"]

    p_cur = db.execute("SELECT COUNT(*) as cnt FROM profiles")
    p_count = fetchone_dict(p_cur)["cnt"]

    g_cur = db.execute("SELECT COUNT(*) as cnt FROM groups")
    g_count = fetchone_dict(g_cur)["cnt"]

    gm_cur = db.execute("SELECT COUNT(*) as cnt FROM group_members")
    gm_count = fetchone_dict(gm_cur)["cnt"]

    conn_cur = db.execute("SELECT COUNT(*) as cnt FROM connections WHERE status = 'accepted'")
    conn_count = fetchone_dict(conn_cur)["cnt"]

    msg_cur = db.execute("SELECT COUNT(*) as cnt FROM messages")
    dm_count = fetchone_dict(msg_cur)["cnt"]

    gmsg_cur = db.execute("SELECT COUNT(*) as cnt FROM group_messages")
    gmsg_count = fetchone_dict(gmsg_cur)["cnt"]

    notif_cur = db.execute("SELECT COUNT(*) as cnt FROM notifications")
    notif_count = fetchone_dict(notif_cur)["cnt"]

    # Category breakdown
    cat_cur = db.execute("SELECT category, COUNT(*) as cnt FROM questions GROUP BY category ORDER BY cnt DESC")
    from app.db.connection import fetchall_dict
    categories = {r["category"]: r["cnt"] for r in fetchall_dict(cat_cur)}

    # Recent profiles (members)
    members_cur = db.execute("SELECT user_id, name, email, picture, is_technical, bio, created_at FROM profiles ORDER BY created_at DESC LIMIT 20")
    members = fetchall_dict(members_cur)

    # Recent questions
    rq_cur = db.execute("SELECT id, title, category, status, created_at FROM questions ORDER BY id DESC LIMIT 10")
    recent_questions = fetchall_dict(rq_cur)

    return {
        "questions": q_count,
        "open": open_count,
        "solved": solved_count,
        "templates": t_count,
        "build_paths": bp_count,
        "answers": a_count,
        "ai_answers": ai_count,
        "community_answers": community_a,
        "profiles": p_count,
        "groups": g_count,
        "group_memberships": gm_count,
        "connections": conn_count,
        "direct_messages": dm_count,
        "group_messages": gmsg_count,
        "notifications": notif_count,
        "categories": categories,
        "members": members,
        "recent_questions": recent_questions,
        "resolution_rate": round((solved_count / max(q_count, 1)) * 100),
        "engagement_score": min(100, p_count * 10 + conn_count * 5 + gm_count * 3 + a_count * 2),
    }


@router.get("/google/url")
async def get_google_auth_url(redirect_uri: str | None = None):
    """Return the Google OAuth consent screen URL."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")

    uri = redirect_uri or GOOGLE_REDIRECT_URI
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    return {"url": f"{GOOGLE_AUTH_URL}?{qs}"}


@router.post("/google/callback")
async def google_callback(body: TokenExchangeRequest):
    """Exchange authorization code for tokens and fetch user profile."""
    redirect_uri = body.redirect_uri or GOOGLE_REDIRECT_URI

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": body.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        })

    if token_resp.status_code != 200:
        logger.error(f"Token exchange failed: {token_resp.text}")
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    tokens = token_resp.json()
    access_token = tokens.get("access_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="No access token received")

    # Fetch user profile
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if user_resp.status_code != 200:
        logger.error(f"Failed to fetch user info: {user_resp.text}")
        raise HTTPException(status_code=400, detail="Failed to fetch user info")

    user_info = user_resp.json()

    logger.info(f"Google login successful: {user_info.get('email')}")

    # Auto-create profile on first login
    uid = user_info.get("id", "")
    try:
        db = get_db()
        cur = db.execute("SELECT user_id FROM profiles WHERE user_id = ?", (uid,))
        if not fetchone_dict(cur):
            db.execute(
                """INSERT INTO profiles (user_id, name, email, picture)
                   VALUES (?, ?, ?, ?)""",
                (uid, user_info.get("name", ""), user_info.get("email", ""),
                 user_info.get("picture", "")),
            )
            db.commit()
            logger.info(f"Auto-created profile for {user_info.get('email')}")
    except Exception as e:
        logger.warning(f"Profile auto-create failed (non-fatal): {e}")

    return {
        "user": {
            "id": uid,
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        },
        "access_token": access_token,
    }

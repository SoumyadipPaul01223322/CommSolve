import logging
import httpx
from typing import Any
from app.config import settings

logger = logging.getLogger(__name__)


def _turso_url() -> str:
    """Convert libsql:// URL to https:// for HTTP API."""
    url = settings.TURSO_DATABASE_URL
    url = url.replace("libsql://", "https://")
    url = url.replace("ws://", "http://").replace("wss://", "https://")
    return url.rstrip("/")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.TURSO_AUTH_TOKEN}",
        "Content-Type": "application/json",
    }


class TursoDB:
    """Lightweight synchronous wrapper around Turso HTTP pipeline API."""

    def __init__(self):
        self._base_url = _turso_url()
        self._pipeline_url = f"{self._base_url}/v2/pipeline"
        self._client = httpx.Client(timeout=30.0, headers=_headers())
        self._pending: list[dict] = []

    def execute(self, sql: str, params: tuple = ()) -> list[dict]:
        """Execute a single SQL statement and return rows as list of dicts."""
        args = [_convert_param(p) for p in params]
        payload = {
            "requests": [
                {"type": "execute", "stmt": {"sql": sql, "args": args}},
                {"type": "close"},
            ]
        }
        resp = self._client.post(self._pipeline_url, json=payload)
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", [])
        if not results:
            return []

        first = results[0]
        if first.get("type") == "error":
            raise Exception(first["error"].get("message", "Turso query error"))

        response_obj = first.get("response", {})
        result_obj = response_obj.get("result", {})
        cols = [c["name"] for c in result_obj.get("cols", [])]
        rows_raw = result_obj.get("rows", [])

        rows = []
        for raw_row in rows_raw:
            row_dict = {}
            for i, col_name in enumerate(cols):
                cell = raw_row[i]
                if isinstance(cell, dict):
                    val = cell.get("value")
                    # Turso returns integers as strings — coerce known int types
                    if cell.get("type") == "integer" and val is not None:
                        val = int(val)
                    elif cell.get("type") == "float" and val is not None:
                        val = float(val)
                    row_dict[col_name] = val
                else:
                    row_dict[col_name] = cell
            rows.append(row_dict)

        return rows

    def execute_batch(self, statements: list[tuple[str, tuple]]):
        """Execute multiple statements in a single pipeline request."""
        requests = []
        for sql, params in statements:
            args = [_convert_param(p) for p in params]
            requests.append({"type": "execute", "stmt": {"sql": sql, "args": args}})
        requests.append({"type": "close"})

        resp = self._client.post(self._pipeline_url, json={"requests": requests})
        resp.raise_for_status()
        data = resp.json()

        for r in data.get("results", []):
            if r.get("type") == "error":
                raise Exception(r["error"].get("message", "Turso batch error"))

    def commit(self):
        """No-op: each execute is auto-committed via HTTP API."""
        pass


def _convert_param(value: Any) -> dict:
    """Convert a Python value to Turso HTTP API arg format."""
    if value is None:
        return {"type": "null", "value": None}
    elif isinstance(value, bool):
        return {"type": "integer", "value": str(int(value))}
    elif isinstance(value, int):
        return {"type": "integer", "value": str(value)}
    elif isinstance(value, float):
        return {"type": "float", "value": str(value)}
    else:
        return {"type": "text", "value": str(value)}


_db_instance: TursoDB | None = None


def get_db() -> TursoDB:
    """Return a singleton TursoDB instance."""
    global _db_instance
    if _db_instance is None:
        _db_instance = TursoDB()
    return _db_instance


def fetchall_dict(rows_or_cursor) -> list[dict]:
    """Identity helper — rows from TursoDB.execute() are already list[dict]."""
    return rows_or_cursor if isinstance(rows_or_cursor, list) else []


def fetchone_dict(rows_or_cursor) -> dict | None:
    """Return first row from list[dict] result, or None."""
    if isinstance(rows_or_cursor, list) and len(rows_or_cursor) > 0:
        return rows_or_cursor[0]
    return None


def init_db():
    """Create all tables in Turso if they don't exist."""
    db = get_db()

    ddl = [
        ("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT NOT NULL,
            reputation INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT,
            status TEXT DEFAULT 'open',
            structured_goal TEXT,
            structured_attempted TEXT,
            structured_error TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            user_id TEXT,
            content TEXT NOT NULL,
            is_accepted BOOLEAN DEFAULT 0,
            is_ai_generated BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES questions(id)
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            difficulty TEXT,
            stack TEXT,
            author_id INTEGER,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS build_paths (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            steps TEXT,
            template_id INTEGER,
            author_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (template_id) REFERENCES templates(id),
            FOREIGN KEY (author_id) REFERENCES users(id)
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_user_id TEXT NOT NULL,
            from_user_name TEXT,
            from_user_picture TEXT,
            to_user_id TEXT NOT NULL,
            to_user_name TEXT,
            to_user_picture TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id TEXT NOT NULL,
            receiver_id TEXT NOT NULL,
            content TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            picture TEXT,
            bio TEXT DEFAULT '',
            is_technical INTEGER DEFAULT 0,
            domains TEXT DEFAULT '[]',
            skills TEXT DEFAULT '[]',
            location TEXT DEFAULT '',
            website TEXT DEFAULT '',
            github TEXT DEFAULT '',
            linkedin TEXT DEFAULT '',
            questions_count INTEGER DEFAULT 0,
            answers_count INTEGER DEFAULT 0,
            reputation INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            icon TEXT DEFAULT '💬',
            color TEXT DEFAULT 'purple',
            creator_id TEXT,
            member_count INTEGER DEFAULT 0,
            is_public INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT,
            user_picture TEXT,
            role TEXT DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups(id)
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS group_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT,
            user_picture TEXT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups(id)
        )""", ()),
        ("""CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT,
            link TEXT DEFAULT '',
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )""", ()),
    ]

    db.execute_batch(ddl)
    logger.info("Turso DB tables initialized successfully.")

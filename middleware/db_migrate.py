from __future__ import annotations

from typing import Optional
from sqlalchemy import text
from .db import engine, SessionLocal


TARGET_DB_LAYER = 3  # increment when adding new migrations


def _get_current_layer(session) -> int:
    try:
        # ensure settings table exists
        session.execute(text(
            "CREATE TABLE IF NOT EXISTS settings (\n"
            "  key TEXT PRIMARY KEY,\n"
            "  value TEXT,\n"
            "  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"
            ")"
        ))
        r = session.execute(text("SELECT value FROM settings WHERE key='db_layer'"))
        row = r.first()
        if not row:
            session.execute(text("INSERT OR REPLACE INTO settings(key, value) VALUES('db_layer', '0')"))
            return 0
        try:
            return int(row[0])
        except Exception:
            return 0
    except Exception:
        session.rollback()
        raise


def _set_layer(session, layer: int) -> None:
    session.execute(text("UPDATE settings SET value=:v, updated_at=CURRENT_TIMESTAMP WHERE key='db_layer'"), {"v": str(layer)})


def _column_exists(session, table: str, column: str) -> bool:
    res = session.execute(text(f"PRAGMA table_info({table})"))
    cols = [row[1] for row in res.fetchall()]
    return column in cols


def run_migrations() -> int:
    """Run DB migrations up to TARGET_DB_LAYER. Returns final layer number."""
    with SessionLocal() as s:
        cur = _get_current_layer(s)
        target = int(TARGET_DB_LAYER)
        if cur >= target:
            s.commit()
            return cur

        # layer 1: ensure settings table (already created) and set to 1
        if cur < 1:
            _set_layer(s, 1)
            cur = 1

        # layer 2: add customers.name/email columns
        if cur < 2:
            if not _column_exists(s, 'customers', 'name'):
                s.execute(text("ALTER TABLE customers ADD COLUMN name TEXT"))
            if not _column_exists(s, 'customers', 'email'):
                s.execute(text("ALTER TABLE customers ADD COLUMN email TEXT"))
            _set_layer(s, 2)
            cur = 2

        # layer 3: identity_links table for external identity mapping
        if cur < 3:
            s.execute(text(
                "CREATE TABLE IF NOT EXISTS identity_links (\n"
                "  id INTEGER PRIMARY KEY,\n"
                "  provider TEXT NOT NULL,\n"
                "  external_user_id TEXT NOT NULL,\n"
                "  user_id INTEGER NOT NULL,\n"
                "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n"
                "  UNIQUE(provider, external_user_id)\n"
                ")"
            ))
            _set_layer(s, 3)
            cur = 3

        s.commit()
        return cur

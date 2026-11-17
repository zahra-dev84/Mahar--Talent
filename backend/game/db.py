# -*- coding: utf-8 -*-
"""
دیتابیس بازی. از همان اتصال‌های موجود پروژه استفاده می‌شود:
  * quiz.db  (question.connect_quiz_db)  ← جدول‌های بازی
  * users.db (database.connect_db)       ← جدول توکن ورود (auth_tokens)
"""
import hashlib
import json
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

from database import connect_db
from question import connect_quiz_db

TOKEN_TTL_DAYS = 30


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def game_conn():
    conn = connect_quiz_db()
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def users_conn():
    conn = connect_db()
    conn.row_factory = sqlite3.Row
    return conn


def dumps(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def loads(text, default=None):
    if text is None:
        return default
    try:
        return json.loads(text)
    except (TypeError, ValueError):
        return default


GAME_SCHEMA = """
CREATE TABLE IF NOT EXISTS game_runs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    run_uid          TEXT    NOT NULL UNIQUE,
    user_id          INTEGER NOT NULL,
    status           TEXT    NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress','completed','abandoned')),
    current_stage    INTEGER NOT NULL DEFAULT 1,
    content_version  TEXT    NOT NULL,
    game_score       INTEGER NOT NULL DEFAULT 0,
    started_at       TEXT    NOT NULL,
    completed_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_game_runs_user ON game_runs(user_id, started_at);

CREATE TABLE IF NOT EXISTS game_stage_results (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id        INTEGER NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
    stage         INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 4),
    game_points   INTEGER NOT NULL DEFAULT 0,
    duration_ms   INTEGER,
    payload_json  TEXT    NOT NULL,
    assessment_json TEXT  NOT NULL,
    started_at    TEXT,
    completed_at  TEXT    NOT NULL,
    UNIQUE (run_id, stage)
);

CREATE TABLE IF NOT EXISTS game_choices (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
    stage       INTEGER NOT NULL,
    choice_key  TEXT    NOT NULL,
    item_id     TEXT,
    value       TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    t_ms        INTEGER,
    created_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_game_choices_run ON game_choices(run_id, stage);

CREATE TABLE IF NOT EXISTS game_task_attempts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
    stage       INTEGER NOT NULL,
    task_id     TEXT    NOT NULL,
    attempt_no  INTEGER NOT NULL,
    is_correct  INTEGER,
    score       REAL,
    duration_ms INTEGER,
    answer_json TEXT,
    detail_json TEXT,
    created_at  TEXT    NOT NULL,
    UNIQUE (run_id, task_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS game_assessment_scores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id     INTEGER NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
    category   TEXT    NOT NULL,
    dimension  TEXT    NOT NULL,
    score      REAL,
    evidence   TEXT,
    source_stage TEXT,
    UNIQUE (run_id, category, dimension)
);

CREATE TABLE IF NOT EXISTS game_badges (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id     INTEGER NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
    badge_key  TEXT    NOT NULL,
    stage      INTEGER,
    earned_at  TEXT    NOT NULL,
    UNIQUE (run_id, badge_key)
);

CREATE TABLE IF NOT EXISTS game_results (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id      INTEGER NOT NULL UNIQUE REFERENCES game_runs(id) ON DELETE CASCADE,
    holland_code TEXT,
    report_json TEXT    NOT NULL,
    created_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS game_recommendations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id     INTEGER NOT NULL REFERENCES game_runs(id) ON DELETE CASCADE,
    rank       INTEGER NOT NULL,
    path_key   TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    match_score REAL   NOT NULL,
    reasons_json TEXT  NOT NULL,
    project_json TEXT  NOT NULL,
    UNIQUE (run_id, rank)
);
"""

TOKEN_SCHEMA = """
CREATE TABLE IF NOT EXISTS auth_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
"""


def init_game_db():
    """ساخت جدول‌ها اگر وجود ندارند (امن برای اجرای چندباره)."""
    conn = game_conn()
    conn.executescript(GAME_SCHEMA)
    conn.commit()
    conn.close()

    uconn = users_conn()
    uconn.executescript(TOKEN_SCHEMA)
    uconn.commit()
    uconn.close()


# ------------------------------------------------------------------ توکن ورود
def _hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_token(user_id):
    token = secrets.token_urlsafe(32)
    conn = users_conn()
    conn.executescript(TOKEN_SCHEMA)
    conn.execute(
        "INSERT INTO auth_tokens (token_hash, user_id, created_at) VALUES (?,?,?)",
        (_hash(token), int(user_id), now_iso()),
    )
    conn.commit()
    conn.close()
    return token


def user_id_for_token(token):
    """شناسه‌ی کاربر برای توکن معتبر؛ در غیر این صورت None."""
    if not token:
        return None
    conn = users_conn()
    row = conn.execute(
        "SELECT user_id, created_at FROM auth_tokens WHERE token_hash=?", (_hash(token),)
    ).fetchone()
    if row is None:
        conn.close()
        return None
    created = datetime.fromisoformat(row["created_at"])
    if datetime.now(timezone.utc) - created > timedelta(days=TOKEN_TTL_DAYS):
        conn.execute("DELETE FROM auth_tokens WHERE token_hash=?", (_hash(token),))
        conn.commit()
        conn.close()
        return None
    uid = row["user_id"]
    # کاربر باید هنوز وجود داشته باشد
    exists = conn.execute("SELECT 1 FROM users WHERE id=?", (uid,)).fetchone()
    conn.close()
    return uid if exists else None


def revoke_token(token):
    conn = users_conn()
    conn.execute("DELETE FROM auth_tokens WHERE token_hash=?", (_hash(token),))
    conn.commit()
    conn.close()

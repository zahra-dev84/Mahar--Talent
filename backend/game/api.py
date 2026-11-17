# -*- coding: utf-8 -*-
"""
API بازی «کشف دنیای توانایی‌ها».

همه‌ی مسیرها (به‌جز ثبت‌نام/ورود قدیمی) با هدر  Authorization: Bearer <token>  محافظت می‌شوند و
هر کاربر فقط به اجراهای (run) خودش دسترسی دارد.
"""
import sqlite3
import uuid
from functools import wraps

from flask import Blueprint, g, jsonify, request

from . import content as C
from . import scoring as S
from .db import (dumps, game_conn, loads, now_iso, user_id_for_token, users_conn)

bp = Blueprint("game", __name__, url_prefix="/game")

MAX_BODY = 64 * 1024


# ------------------------------------------------------------------ ابزارها
def _err(message, status=400):
    return jsonify({"message": message}), status


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header[7:].strip() if header.lower().startswith("bearer ") else ""
        uid = user_id_for_token(token)
        if uid is None:
            return _err("ابتدا وارد حساب کاربری شوید", 401)
        g.user_id = uid
        return fn(*args, **kwargs)
    return wrapper


def _json_body():
    if request.content_length and request.content_length > MAX_BODY:
        raise S.ValidationError("حجم درخواست زیاد است")
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise S.ValidationError("بدنه‌ی درخواست باید JSON باشد")
    return data


def _get_run(conn, run_id):
    """اجرای متعلق به کاربر فعلی؛ در غیر این صورت None (حتی اگر وجود داشته باشد)."""
    return conn.execute("SELECT * FROM game_runs WHERE id=? AND user_id=?", (run_id, g.user_id)).fetchone()


def _run_dict(row):
    return {"id": row["id"], "run_uid": row["run_uid"], "status": row["status"], "current_stage": row["current_stage"],
            "game_score": row["game_score"], "started_at": row["started_at"], "completed_at": row["completed_at"]}


def _completed_stages(conn, run_id):
    rows = conn.execute("SELECT stage, game_points FROM game_stage_results WHERE run_id=? ORDER BY stage", (run_id,)).fetchall()
    return {r["stage"]: r["game_points"] for r in rows}


def _badges(conn, run_id):
    rows = conn.execute("SELECT badge_key, stage, earned_at FROM game_badges WHERE run_id=? ORDER BY id", (run_id,)).fetchall()
    out = []
    for r in rows:
        b = C.BADGE_BY_KEY.get(r["badge_key"])
        if b:
            out.append({**b, "stage": r["stage"], "earned_at": r["earned_at"]})
    return out


def _attempts(conn, run_id):
    rows = conn.execute("SELECT * FROM game_task_attempts WHERE run_id=? ORDER BY task_id, attempt_no", (run_id,)).fetchall()
    out = {}
    for r in rows:
        out.setdefault(r["task_id"], []).append({
            "attempt_no": r["attempt_no"], "is_correct": r["is_correct"], "score": r["score"],
            "detail": loads(r["detail_json"], {}) or {}, "answer": loads(r["answer_json"]),
        })
    return out


def _choices(conn, run_id, stage):
    rows = conn.execute("SELECT * FROM game_choices WHERE run_id=? AND stage=? ORDER BY id", (run_id, stage)).fetchall()
    return [dict(r) for r in rows]


def _insert_choices(conn, run_id, stage, items):
    ts = now_iso()
    conn.executemany(
        "INSERT INTO game_choices (run_id, stage, choice_key, item_id, value, order_index, t_ms, created_at) VALUES (?,?,?,?,?,?,?,?)",
        [(run_id, stage, k, item, val, idx, t, ts) for (k, item, val, idx, t) in items])


def _award(conn, run_id, stage, keys):
    new = []
    for key in keys:
        cur = conn.execute("INSERT OR IGNORE INTO game_badges (run_id, badge_key, stage, earned_at) VALUES (?,?,?,?)",
                           (run_id, key, stage, now_iso()))
        if cur.rowcount:
            new.append(C.BADGE_BY_KEY[key])
    return new


@bp.errorhandler(S.ValidationError)
def _on_validation(e):
    return _err(str(e), 400)


@bp.errorhandler(sqlite3.Error)
def _on_db_error(e):
    print("GAME DB ERROR:", e)
    return _err("خطا در ذخیره‌سازی اطلاعات", 500)


# ------------------------------------------------------------------ اطلاعات پایه
@bp.route("/content", methods=["GET"])
@require_auth
def content():
    return jsonify(C.public_content())


@bp.route("/me", methods=["GET"])
@require_auth
def me():
    conn = users_conn()
    row = conn.execute("SELECT id, firstName, lastName FROM users WHERE id=?", (g.user_id,)).fetchone()
    conn.close()
    return jsonify({"id": row["id"], "firstName": row["firstName"], "lastName": row["lastName"]})


# ------------------------------------------------------------------ اجرای بازی
@bp.route("/runs", methods=["GET"])
@require_auth
def list_runs():
    conn = game_conn()
    rows = conn.execute(
        """SELECT r.*, res.holland_code FROM game_runs r
           LEFT JOIN game_results res ON res.run_id = r.id
           WHERE r.user_id=? ORDER BY r.id DESC LIMIT 10""", (g.user_id,)).fetchall()
    out = [{**_run_dict(r), "holland_code": r["holland_code"]} for r in rows]
    conn.close()
    return jsonify(out)


@bp.route("/runs", methods=["POST"])
@require_auth
def create_run():
    conn = game_conn()
    # هر اجرای جدید مستقل است؛ اجراهای نیمه‌کاره‌ی قبلی «رها شده» علامت می‌خورند.
    conn.execute("UPDATE game_runs SET status='abandoned' WHERE user_id=? AND status='in_progress'", (g.user_id,))
    cur = conn.execute(
        "INSERT INTO game_runs (run_uid, user_id, status, current_stage, content_version, started_at) VALUES (?,?,?,?,?,?)",
        (uuid.uuid4().hex, g.user_id, "in_progress", 1, C.CONTENT_VERSION, now_iso()))
    conn.commit()
    row = conn.execute("SELECT * FROM game_runs WHERE id=?", (cur.lastrowid,)).fetchone()
    out = _run_dict(row)
    conn.close()
    return jsonify(out), 201


@bp.route("/runs/<int:run_id>", methods=["GET"])
@require_auth
def run_state(run_id):
    conn = game_conn()
    run = _get_run(conn, run_id)
    if run is None:
        conn.close()
        return _err("اجرای بازی پیدا نشد", 404)
    out = {"run": _run_dict(run), "stage_points": _completed_stages(conn, run_id), "badges": _badges(conn, run_id)}
    conn.close()
    return jsonify(out)


@bp.route("/runs/<int:run_id>/resume", methods=["POST"])
@require_auth
def resume_run(run_id):
    """یک اجرای رهاشده را دوباره فعال می‌کند (فقط اگر هنوز تمام نشده و اجرای فعال دیگری وجود ندارد)."""
    conn = game_conn()
    run = _get_run(conn, run_id)
    if run is None:
        conn.close()
        return _err("اجرای بازی پیدا نشد", 404)
    if run["status"] == "completed":
        conn.close()
        return _err("این اجرا تمام شده است", 409)
    conn.execute("UPDATE game_runs SET status='abandoned' WHERE user_id=? AND status='in_progress' AND id<>?", (g.user_id, run_id))
    conn.execute("UPDATE game_runs SET status='in_progress' WHERE id=?", (run_id,))
    conn.commit()
    run = _get_run(conn, run_id)
    out = {"run": _run_dict(run), "stage_points": _completed_stages(conn, run_id), "badges": _badges(conn, run_id)}
    conn.close()
    return jsonify(out)


def _require_active(conn, run_id):
    run = _get_run(conn, run_id)
    if run is None:
        return None, _err("اجرای بازی پیدا نشد", 404)
    if run["status"] != "in_progress":
        return None, _err("این اجرای بازی فعال نیست", 409)
    return run, None


@bp.route("/runs/<int:run_id>/stages/<int:stage>/start", methods=["POST"])
@require_auth
def start_stage(run_id, stage):
    if stage not in (1, 2, 3, 4):
        return _err("مرحله نامعتبر", 404)
    conn = game_conn()
    run, err = _require_active(conn, run_id)
    if err:
        conn.close()
        return err
    done = _completed_stages(conn, run_id)
    if stage in done:
        conn.close()
        return _err("این مرحله قبلاً تمام شده است", 409)
    if stage > 1 and (stage - 1) not in done:
        conn.close()
        return _err("ابتدا مرحله‌ی قبل را تمام کن", 409)
    # شروع تازه: داده‌های نیمه‌کاره‌ی همین مرحله پاک می‌شود
    conn.execute("DELETE FROM game_choices WHERE run_id=? AND stage=?", (run_id, stage))
    conn.execute("DELETE FROM game_task_attempts WHERE run_id=? AND stage=?", (run_id, stage))
    _insert_choices(conn, run_id, stage, [("stage_start", None, None, 0, 0)])
    conn.execute("UPDATE game_runs SET current_stage=? WHERE id=?", (stage, run_id))
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "stage": stage})


STAGE3_CHOICES = {
    "station_open": {"items": {"pattern", "sort", "design", "circuit"}, "values": None},
    "bonus_circuit": {"items": {"circuit"}, "values": {"accepted", "skipped"}},
    "design_revise": {"items": {"design"}, "values": {"declined"}},
}


@bp.route("/runs/<int:run_id>/choice", methods=["POST"])
@require_auth
def record_choice(run_id):
    data = _json_body()
    conn = game_conn()
    run, err = _require_active(conn, run_id)
    if err:
        conn.close()
        return err
    key, item, value = data.get("key"), data.get("item"), data.get("value")
    rule = STAGE3_CHOICES.get(key)
    if not rule or item not in rule["items"] or (rule["values"] and value not in rule["values"]):
        conn.close()
        raise S.ValidationError("انتخاب نامعتبر")
    n = conn.execute("SELECT COUNT(*) FROM game_choices WHERE run_id=? AND stage=3 AND choice_key=?", (run_id, key)).fetchone()[0]
    _insert_choices(conn, run_id, 3, [(key, item, value, n, S._t(data))])
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@bp.route("/runs/<int:run_id>/stage3/attempt", methods=["POST"])
@require_auth
def stage3_attempt(run_id):
    data = _json_body()
    conn = game_conn()
    try:
        return _stage3_attempt(conn, run_id, data)
    finally:
        conn.close()


def _stage3_attempt(conn, run_id, data):
    task = data.get("task")
    run, err = _require_active(conn, run_id)
    if err:
        return err
    if _completed_stages(conn, run_id).get(3):
        return _err("مرحله ۳ تمام شده است", 409)
    prev = conn.execute("SELECT MAX(attempt_no) FROM game_task_attempts WHERE run_id=? AND task_id=?", (run_id, task)).fetchone()[0] or 0
    attempts = _attempts(conn, run_id)
    if attempts.get(task) and attempts[task][-1]["detail"].get("final"):
        return _err("این مأموریت تمام شده است", 409)
    no = prev + 1
    duration = S._int(data.get("duration_ms", 0), 0, 3_600_000, "duration")

    if task in S.PATTERN:
        res = S.eval_pattern(task, data.get("option"), no)
        answer, score, correct = {"option": data.get("option")}, res["score"], res["correct"]
    elif task == "sort":
        res = S.eval_sort(data.get("placement"), no)
        answer, correct = {"placement": data.get("placement")}, res["correct"]
        score = res["correct_count"] / res["total"]
    elif task == "design":
        prev_detail = attempts["design"][-1]["detail"] if attempts.get("design") else None
        res = S.eval_design(data.get("placed"), data.get("theme"), data.get("title"), no, prev_detail)
        answer = {"placed": res["placed"], "theme": data.get("theme"), "title": res["title"]}
        score, correct = res["metrics"]["index"] / 100, None
    elif task == "circuit":
        res = S.eval_circuit(data.get("rotations"), no)
        answer, correct, score = {"rotations": data.get("rotations")}, res["correct"], 1.0 if res["correct"] else 0.0
    else:
        raise S.ValidationError("مأموریت نامعتبر")

    conn.execute(
        """INSERT INTO game_task_attempts (run_id, stage, task_id, attempt_no, is_correct, score, duration_ms, answer_json, detail_json, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (run_id, 3, task, no, None if correct is None else int(bool(correct)), score, duration,
         dumps(answer), dumps(res), now_iso()))
    conn.commit()
    return jsonify({k: v for k, v in res.items() if k != "placed"})


def _store_assessment_rows(conn, run_id, report):
    rows = []
    for k, v in report["interest"]["index"].items():
        rows.append(("interest", k, v, {"share": report["interest"]["shares"][k], "stage1": report["interest"]["stage1"][k],
                                         "stage4": report["interest"]["stage4"][k]}, "1,4"))
    rows.append(("interest", "consistency", report["interest"]["consistency"], {"label": report["interest"]["consistency_label"]}, "1,4"))
    for k, v in report["approach"]["index"].items():
        rows.append(("approach", k, v, {"share": report["approach"]["shares"][k]}, "2"))
    rows.append(("approach", "risk", report["approach"]["risk"]["value"], {"label": report["approach"]["risk"]["label"]}, "2"))
    rows.append(("approach", "clues_viewed", report["approach"]["clues_viewed"], None, "2"))
    rows.append(("approach", "variety", report["approach"]["variety"], None, "2"))
    for k, v in report["performance"]["scores"].items():
        rows.append(("performance", k, v, {"band": report["performance"]["bands"][k]}, "3"))
    rows.append(("performance", "learning_from_feedback", report["performance"]["learning"]["score"],
                 {"opportunities": report["performance"]["learning"]["opportunities"], "improved": report["performance"]["learning"]["improved"]}, "3"))
    for k, v in report["motives"]["shares"].items():
        rows.append(("motive", k, v, {"gems": report["motives"]["gems"][k], "chips": report["motives"]["chips"][k]}, "1,4"))
    conn.executemany(
        "INSERT OR REPLACE INTO game_assessment_scores (run_id, category, dimension, score, evidence, source_stage) VALUES (?,?,?,?,?,?)",
        [(run_id, c, d, s, dumps(e) if e is not None else None, st) for (c, d, s, e, st) in rows])


@bp.route("/runs/<int:run_id>/stages/<int:stage>/complete", methods=["POST"])
@require_auth
def complete_stage(run_id, stage):
    if stage not in (1, 2, 3, 4):
        return _err("مرحله نامعتبر", 404)
    data = _json_body()
    conn = game_conn()
    try:
        run, err = _require_active(conn, run_id)
        if err:
            return err
        done = _completed_stages(conn, run_id)
        if stage in done:
            return _err("این مرحله قبلاً ثبت شده است", 409)
        if stage > 1 and (stage - 1) not in done:
            return _err("ابتدا مرحله‌ی قبل را تمام کن", 409)

        started = conn.execute(
            "SELECT created_at FROM game_choices WHERE run_id=? AND stage=? AND choice_key='stage_start' ORDER BY id DESC LIMIT 1",
            (run_id, stage)).fetchone()

        if stage == 1:
            ev = S.evaluate_stage1(data)
        elif stage == 2:
            ev = S.evaluate_stage2(data)
        elif stage == 4:
            ev = S.evaluate_stage4(data)
        else:
            attempts = _attempts(conn, run_id)
            choices = _choices(conn, run_id, 3)
            missing = S.stage3_missing(attempts, choices)
            if missing:
                raise S.ValidationError("هنوز مأموریت‌های اجباری تمام نشده‌اند")
            ev = S.evaluate_stage3(attempts, choices)
            ev["choices"] = []
            ev["duration_ms"] = S._int(data.get("duration_ms", 0), 0, 3_600_000, "duration")

        conn.execute("BEGIN")
        conn.execute(
            """INSERT INTO game_stage_results (run_id, stage, game_points, duration_ms, payload_json, assessment_json, started_at, completed_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (run_id, stage, ev["points"], ev["duration_ms"], dumps(data), dumps(ev["assessment"]),
             started["created_at"] if started else None, now_iso()))
        if ev["choices"]:
            _insert_choices(conn, run_id, stage, ev["choices"])

        assessments = {}
        for r in conn.execute("SELECT stage, assessment_json FROM game_stage_results WHERE run_id=?", (run_id,)).fetchall():
            assessments[r["stage"]] = loads(r["assessment_json"])
        new_badges = _award(conn, run_id, stage, S.badges_for(stage, assessments, None))

        total = conn.execute("SELECT COALESCE(SUM(game_points),0) FROM game_stage_results WHERE run_id=?", (run_id,)).fetchone()[0]
        next_stage = min(stage + 1, 4)
        result = {"stage": stage, "points": ev["points"], "game_score": total,
                  "new_badges": new_badges, "next_stage": None if stage == 4 else next_stage}

        if stage == 4:
            stage_points = {r["stage"]: r["game_points"] for r in conn.execute(
                "SELECT stage, game_points FROM game_stage_results WHERE run_id=?", (run_id,)).fetchall()}
            game_block = {"score": total, "stage_points": stage_points, "badges": _badges(conn, run_id)}
            report = S.build_report(assessments, game_block)
            _store_assessment_rows(conn, run_id, report)
            ts = now_iso()
            conn.execute("INSERT OR REPLACE INTO game_results (run_id, holland_code, report_json, created_at) VALUES (?,?,?,?)",
                         (run_id, report["headline"]["holland_code"], dumps(report), ts))
            conn.execute("DELETE FROM game_recommendations WHERE run_id=?", (run_id,))
            for rec in report["recommendations"]:
                conn.execute(
                    """INSERT INTO game_recommendations (run_id, rank, path_key, title, match_score, reasons_json, project_json)
                       VALUES (?,?,?,?,?,?,?)""",
                    (run_id, rec["rank"], rec["key"], rec["title"], rec["match"],
                     dumps({"reasons": rec["reasons"], "cautions": rec["cautions"]}), dumps(rec["project"])))
            conn.execute("UPDATE game_runs SET status='completed', completed_at=?, current_stage=4, game_score=? WHERE id=?", (ts, total, run_id))
            result["report_ready"] = True
        else:
            conn.execute("UPDATE game_runs SET current_stage=?, game_score=? WHERE id=?", (next_stage, total, run_id))
        conn.commit()
        return jsonify(result)
    except Exception:
        if conn.in_transaction:
            conn.rollback()
        raise
    finally:
        conn.close()


@bp.route("/runs/<int:run_id>/report", methods=["GET"])
@require_auth
def get_report(run_id):
    conn = game_conn()
    run = _get_run(conn, run_id)
    if run is None:
        conn.close()
        return _err("اجرای بازی پیدا نشد", 404)
    row = conn.execute("SELECT report_json FROM game_results WHERE run_id=?", (run_id,)).fetchone()
    if row is None:
        conn.close()
        return _err("گزارش هنوز آماده نیست", 404)
    report = loads(row["report_json"])
    # نشان‌ها و امتیاز جدید ممکن است بعد از ساخت گزارش تغییر نکنند، اما همیشه از دیتابیس خوانده می‌شوند
    report["game"]["badges"] = _badges(conn, run_id)
    conn.close()
    return jsonify({"run": _run_dict(run), "report": report})

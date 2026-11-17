# -*- coding: utf-8 -*-
"""
تست سرتاسری بک‌اند بازی (روی دیتابیس موقت؛ دیتابیس واقعی پروژه دست نمی‌خورد).

اجرا:   cd backend && python test_game_flow.py
"""
import json
import os
import sqlite3
import sys
import tempfile
import types

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

try:
    import flask_cors  # noqa: F401
except ImportError:  # فقط برای محیط تست بدون flask-cors
    stub = types.ModuleType("flask_cors")
    stub.CORS = lambda app, *a, **k: None
    sys.modules["flask_cors"] = stub

tmp = tempfile.mkdtemp(prefix="mahar_game_test_")
os.chdir(tmp)  # اتصال‌های پروژه نسبی‌اند (users.db / quiz.db)

import app as backend  # noqa: E402
from game import content as C  # noqa: E402
from game import scoring as S  # noqa: E402

client = backend.app.test_client()
ok_count = 0


def check(cond, msg):
    global ok_count
    if not cond:
        raise AssertionError("FAILED: " + msg)
    ok_count += 1


def api(method, url, token=None, body=None, expect=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = getattr(client, method)(url, json=body, headers=headers)
    if expect is not None:
        check(r.status_code == expect, f"{method.upper()} {url} -> {r.status_code} (expected {expect}): {r.get_data(as_text=True)[:300]}")
    return r.get_json()


def register(n):
    d = api("post", "/register", body={"firstName": f"کاربر{n}", "lastName": "تست", "PhonNumber": f"0912000000{n}",
                                       "email": f"u{n}@example.com", "password": "x"}, expect=200)
    check("token" in d and d["id"], "register returns token")
    return d["id"], d["token"]


# ---------------------------------------------------------------- محتوا و احراز هویت
check(not S.circuit_start_solved(), "circuit must not start solved")
rot = [t["rot"] for t in C.CIRCUIT["tiles"]]
for i, r in C.CIRCUIT["_solution"].items():
    rot[i] = r
check(S.eval_circuit(rot, 1)["correct"], "circuit solution must light the lamp")

api("get", "/game/content", expect=401)
uid1, tok1 = register(1)
uid2, tok2 = register(2)
content = api("get", "/game/content", tok1, expect=200)
check("_correct" not in json.dumps(content) and "_weights" not in json.dumps(content), "private keys are stripped")

login = api("post", "/login", body={"email": "u1@example.com", "password": "x"}, expect=200)
check(login.get("token"), "login returns token")

# ---------------------------------------------------------------- اجرای جدید
run = api("post", "/game/runs", tok1, expect=201)
rid = run["id"]
api("post", f"/game/runs/{rid}/stages/2/start", tok1, expect=409)  # ترتیب مراحل
api("get", f"/game/runs/{rid}", tok2, expect=404)                   # جداسازی کاربران
api("post", f"/game/runs/{rid}/stages/1/complete", tok2, body={}, expect=404)

# ---- مرحله ۱
api("post", f"/game/runs/{rid}/stages/1/start", tok1, expect=200)
bad = {"zones": [{"id": "lab", "reaction": "love"}], "stars": []}
api("post", f"/game/runs/{rid}/stages/1/complete", tok1, body=bad, expect=400)
s1 = {"zones": [
    {"id": "lab", "reaction": "love", "motive": "competence", "dwell_ms": 5000, "t_ms": 6000},
    {"id": "tech", "reaction": "love", "motive": "autonomy", "dwell_ms": 4000, "t_ms": 12000},
    {"id": "studio", "reaction": "ok", "dwell_ms": 3000, "t_ms": 18000},
    {"id": "hub", "reaction": "no", "dwell_ms": 2000, "t_ms": 22000},
    {"id": "workshop", "reaction": "ok", "dwell_ms": 2500, "t_ms": 26000},
], "stars": [{"zone": "lab", "t_ms": 30000}, {"zone": "tech", "t_ms": 31000}, {"zone": "studio", "t_ms": 32000}], "duration_ms": 40000}
r1 = api("post", f"/game/runs/{rid}/stages/1/complete", tok1, body=s1, expect=200)
check(r1["points"] > 0 and "explorer" in [b["key"] for b in r1["new_badges"]], "stage1 points + explorer badge")
api("post", f"/game/runs/{rid}/stages/1/complete", tok1, body=s1, expect=409)  # ثبت دوباره ممکن نیست

# ---- مرحله ۲
api("post", f"/game/runs/{rid}/stages/2/start", tok1, expect=200)
s2_bad = {"clues": ["control"], "scene1": {"option": "s1_analytic"}, "scene2": {"option": "s2_hw_fix"},
          "tools": {"options": ["t_scanner", "t_map"]}, "scene4": {"option": "s4_sim"}}
api("post", f"/game/runs/{rid}/stages/2/complete", tok1, body=s2_bad, expect=400)  # شاخه‌ی داستان ناهم‌خوان
s2 = {"clues": ["control", "power", "square"], "scene1": {"option": "s1_analytic", "t_ms": 5000},
      "scene2": {"option": "s2_sw_trace", "cause": "software", "t_ms": 7000},
      "tools": {"options": ["t_scanner", "t_checklist"], "t_ms": 4000}, "scene4": {"option": "s4_sim", "t_ms": 6000}, "duration_ms": 60000}
r2 = api("post", f"/game/runs/{rid}/stages/2/complete", tok1, body=s2, expect=200)
check({"city_savior", "detective"} <= {b["key"] for b in r2["new_badges"]}, "stage2 badges")

# ---- مرحله ۳
api("post", f"/game/runs/{rid}/stages/3/start", tok1, expect=200)
api("post", f"/game/runs/{rid}/stages/3/complete", tok1, body={}, expect=400)  # هنوز مأموریتی انجام نشده
for st in ("pattern", "sort", "design", "circuit"):
    api("post", f"/game/runs/{rid}/choice", tok1, body={"key": "station_open", "item": st, "t_ms": 1000}, expect=200)
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "p1", "option": "a"}, expect=200)
check(not a["correct"] and a["hint"] and not a["final"], "p1 wrong first -> hint")
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "p1", "option": "b"}, expect=200)
check(a["correct"] and a["final"] and a["points"] == C.POINTS["pattern_second"], "p1 second try correct")
api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "p1", "option": "b"}, expect=409)
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "p2", "option": "c"}, expect=200)
check(a["correct"] and a["points"] == C.POINTS["pattern_first"], "p2 first try")

placement = {i["id"]: i["_bin"] for i in C.SORT_ITEMS}
wrong = dict(placement)
wrong["ruler"], wrong["hammer"] = "build", "measure"
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "sort", "placement": wrong}, expect=200)
check(a["correct_count"] == 7 and not a["final"] and a["per_item"]["ruler"] is False, "sort feedback")
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "sort", "placement": placement}, expect=200)
check(a["correct"] and a["final"], "sort fixed on second try")

placed = [{"item": "screen", "x": 100, "y": 80}, {"item": "robot", "x": 400, "y": 90}, {"item": "table", "x": 250, "y": 260},
          {"item": "lamp", "x": 500, "y": 280}]
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "design", "placed": placed, "theme": "tech", "title": ""}, expect=200)
check(a["can_revise"] and a["suggestion"], "design feedback offers revision")
placed.append({"item": "painting", "x": 150, "y": 280})
placed.append({"item": "mic", "x": 300, "y": 150})
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "design", "placed": placed, "theme": "tech", "title": "غرفه ما"}, expect=200)
check(a["final"] and a["acted_on_feedback"] is not None, "design revision evaluated")

bad_rot = [t["rot"] for t in C.CIRCUIT["tiles"]]
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "circuit", "rotations": bad_rot}, expect=200)
check(not a["correct"], "circuit start unsolved")
a = api("post", f"/game/runs/{rid}/stage3/attempt", tok1, body={"task": "circuit", "rotations": rot}, expect=200)
check(a["correct"] and a["powered"], "circuit solved")
api("post", f"/game/runs/{rid}/choice", tok1, body={"key": "bonus_circuit", "item": "circuit", "value": "accepted"}, expect=200)
r3 = api("post", f"/game/runs/{rid}/stages/3/complete", tok1, body={"duration_ms": 120000}, expect=200)
check({"pattern_hunter", "organizer", "bounce_back", "circuit_fixer"} <= {b["key"] for b in r3["new_badges"]}, "stage3 badges")

# ---- مرحله ۴
api("post", f"/game/runs/{rid}/stages/4/start", tok1, expect=200)
s4_bad = {"worlds": [{"id": "code"}, {"id": "data"}, {"id": "code"}], "gems": {"autonomy": 2, "competence": 2, "relatedness": 2}}
api("post", f"/game/runs/{rid}/stages/4/complete", tok1, body=s4_bad, expect=400)
s4 = {"worlds": [{"id": "data", "t_ms": 3000}, {"id": "code", "t_ms": 5000}, {"id": "design", "t_ms": 8000}],
      "gems": {"autonomy": 1, "competence": 4, "relatedness": 1}, "duration_ms": 30000}
r4 = api("post", f"/game/runs/{rid}/stages/4/complete", tok1, body=s4, expect=200)
check(r4.get("report_ready") and "full_journey" in [b["key"] for b in r4["new_badges"]], "stage4 completes run")

# ---------------------------------------------------------------- گزارش
rep = api("get", f"/game/runs/{rid}/report", tok1, expect=200)["report"]
api("get", f"/game/runs/{rid}/report", tok2, expect=404)
check(len(rep["recommendations"]) == 3, "three recommended paths")
check(len({r["family"] for r in rep["recommendations"]}) >= 2, "paths are diverse")
check(all(r["reasons"] and r["project"]["steps"] for r in rep["recommendations"]), "reasons + starter projects")
check(rep["headline"]["holland_code"][0] in "IC", f"expected I/C-led code, got {rep['headline']['holland_code']}")
check(set(rep["interest"]["index"]) == set("RIASEC"), "interest profile has 6 dims")
check(rep["performance"]["scores"]["spatial"] == 45.0 or rep["performance"]["scores"]["spatial"] == 70.0, "spatial score from two attempts")
check(rep["game"]["score"] == sum(rep["game"]["stage_points"].values()), "game score = sum of stage points")
check(len(rep["game"]["badges"]) >= 8, "badges stored")

# ---------------------------------------------------------------- دیتابیس
conn = sqlite3.connect("quiz.db")
counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in
          ("game_runs", "game_stage_results", "game_choices", "game_task_attempts", "game_assessment_scores",
           "game_badges", "game_results", "game_recommendations")}
print("DB rows:", counts)
check(all(v > 0 for v in counts.values()), "every game table has data")
check(conn.execute("SELECT user_id FROM game_runs WHERE id=?", (rid,)).fetchone()[0] == uid1, "run bound to user")
conn.close()

# ---------------------------------------------------------------- اجرای جدید مستقل
run_b = api("post", "/game/runs", tok1, expect=201)
check(run_b["id"] != rid and run_b["current_stage"] == 1, "new run is independent")
runs = api("get", "/game/runs", tok1, expect=200)
check(len(runs) == 2 and runs[0]["id"] == run_b["id"], "runs listed newest first")
check(api("get", "/game/runs", tok2, expect=200) == [], "other user sees no runs")

print(f"\nOK — {ok_count} checks passed.")
print("Holland code:", rep["headline"]["holland_code"], "| paths:", [r["title"] + f" ({r['match']}%)" for r in rep["recommendations"]])

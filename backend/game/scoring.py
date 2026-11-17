# -*- coding: utf-8 -*-
"""
موتور امتیازدهی و ارزیابی بازی (کاملاً سمت سرور).

دو خروجی کاملاً جدا:
  * game_points      : امتیاز انگیزشی بازی (فقط پاداش است و در ارزیابی استفاده نمی‌شود)
  * assessment       : شاخص‌های روان‌شناختی (علاقه، رویکرد، عملکرد مشاهده‌شده، انگیزه)

هیچ‌یک از شاخص‌ها «تشخیص قطعی» نیستند؛ فقط شواهد رفتاری همین بازی‌اند.
"""
import math

from . import content as C
from .catalog import PATHS, MAX_PER_FAMILY

ZONE = {z["id"]: z for z in C.ZONES}
WORLD = {w["id"]: w for w in C.WORLDS}
CLUE = {c["id"]: c for c in C.CLUES}
S1_OPT = {o["id"]: o for o in C.SCENE1["options"]}
S2_OPT = {o["id"]: (cause, o) for cause, blk in C.SCENE2["causes"].items() for o in blk["options"]}
TOOL = {o["id"]: o for o in C.TOOLS["options"]}
S4_OPT = {o["id"]: o for o in C.SCENE4["options"]}
PATTERN = {p["id"]: p for p in C.PATTERNS}
SORT_ITEM = {i["id"]: i for i in C.SORT_ITEMS}
SORT_BIN = {b["id"] for b in C.SORT_BINS}
DESIGN_ITEM = {i["id"]: i for i in C.DESIGN_ITEMS}
THEME = {t["id"]: t for t in C.DESIGN_THEMES}

SORT_TOTAL = len(C.SORT_ITEMS)
POINTS = C.POINTS


class ValidationError(ValueError):
    pass


# ------------------------------------------------------------------ ابزارهای عددی
def _zero():
    return {k: 0.0 for k in C.RIASEC}


def _normalize(weights):
    total = sum(weights.values())
    return {k: v / total for k, v in weights.items()} if total else {}


def _shares(vec, keys=None):
    keys = keys or list(vec.keys())
    total = sum(vec.get(k, 0.0) for k in keys)
    return {k: (vec.get(k, 0.0) / total if total > 0 else 0.0) for k in keys}


def _cosine(a, b):
    keys = set(a) | set(b)
    dot = sum(a.get(k, 0.0) * b.get(k, 0.0) for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def _index(shares):
    """شاخص نسبی ۰ تا ۱۰۰ (برترین بُعد = ۱۰۰)."""
    top = max(shares.values()) if shares else 0
    return {k: round(100 * v / top) if top else 0 for k, v in shares.items()}


def _int(value, lo, hi, name):
    try:
        v = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"مقدار «{name}» نامعتبر است")
    return max(lo, min(hi, v))


def _t(item):
    return _int(item.get("t_ms", 0) if isinstance(item, dict) else 0, 0, 3_600_000, "t_ms")


def _band(score):
    if score is None:
        return "سنجیده نشد"
    if score >= 75:
        return "قوی"
    if score >= 55:
        return "خوب"
    if score >= 35:
        return "در حال رشد"
    return "نیازمند تمرین"


# ================================================================== مرحله ۱
def evaluate_stage1(payload):
    zones = payload.get("zones")
    stars = payload.get("stars")
    if not isinstance(zones, list) or not isinstance(stars, list):
        raise ValidationError("داده‌های مرحله ۱ ناقص است")
    seen = {}
    for idx, z in enumerate(zones):
        zid = z.get("id") if isinstance(z, dict) else None
        if zid not in ZONE or zid in seen:
            raise ValidationError("محیط نامعتبر یا تکراری")
        reaction = z.get("reaction")
        if reaction not in C.REACTIONS:
            raise ValidationError("واکنش نامعتبر")
        motive = z.get("motive")
        if motive is not None and (motive not in C.MOTIVES or reaction != "love"):
            raise ValidationError("دلیل انتخاب نامعتبر")
        seen[zid] = {"reaction": reaction, "motive": motive,
                     "dwell_ms": _int(z.get("dwell_ms", 0), 0, 600_000, "dwell"), "t_ms": _t(z), "order": idx}
    if len(seen) < 3:
        raise ValidationError("حداقل سه محیط باید بررسی شود")
    star_ids = []
    for s in stars:
        zid = s.get("zone") if isinstance(s, dict) else None
        if zid not in ZONE or zid in star_ids:
            raise ValidationError("ستاره نامعتبر یا تکراری")
        star_ids.append(zid)
    if len(star_ids) != C.STARS:
        raise ValidationError(f"باید دقیقاً {C.STARS} ستاره بگذاری")

    zone_scores = {}
    for zid in ZONE:
        r = C.REACTIONS[seen[zid]["reaction"]]["value"] if zid in seen else 0
        zone_scores[zid] = r + (3 if zid in star_ids else 0)

    vec = _zero()
    for zid, sc in zone_scores.items():
        for letter, w in _normalize(ZONE[zid]["_weights"]).items():
            vec[letter] += sc * w
    shares = _shares(vec, C.RIASEC)

    chips = {m: 0 for m in C.MOTIVES}
    for v in seen.values():
        if v["motive"]:
            chips[v["motive"]] += 1

    choices = []
    for zid, v in sorted(seen.items(), key=lambda kv: kv[1]["order"]):
        choices.append(("zone_reaction", zid, v["reaction"], v["order"], v["t_ms"]))
        if v["motive"]:
            choices.append(("zone_motive", zid, v["motive"], v["order"], v["t_ms"]))
    for i, s in enumerate(stars):
        choices.append(("star", s["zone"], "1", i, _t(s)))

    points = (POINTS["zone_visit"] * len(seen) + POINTS["star"] * C.STARS
              + POINTS["motive_chip"] * sum(chips.values()) + POINTS["stage_complete"])
    assessment = {
        "interest_shares": shares, "zone_scores": zone_scores, "visited": len(seen),
        "loved": [z for z, v in seen.items() if v["reaction"] == "love"],
        "stars": star_ids, "motive_chips": chips,
        "dwell_total_ms": sum(v["dwell_ms"] for v in seen.values()),
    }
    return {"assessment": assessment, "points": points, "choices": choices,
            "duration_ms": _int(payload.get("duration_ms", 0), 0, 3_600_000, "duration")}


# ================================================================== مرحله ۲
def evaluate_stage2(payload):
    clues = payload.get("clues", [])
    if not isinstance(clues, list) or len(set(clues)) != len(clues) or any(c not in CLUE for c in clues):
        raise ValidationError("سرنخ نامعتبر")
    s1, s2, tl, s4 = (payload.get(k) for k in ("scene1", "scene2", "tools", "scene4"))
    if not all(isinstance(x, dict) for x in (s1, s2, tl, s4)):
        raise ValidationError("داده‌های مرحله ۲ ناقص است")
    o1 = S1_OPT.get(s1.get("option"))
    if not o1:
        raise ValidationError("انتخاب صحنه ۱ نامعتبر")
    found = S2_OPT.get(s2.get("option"))
    if not found or found[0] != o1["cause"]:
        raise ValidationError("انتخاب صحنه ۲ با مسیر داستان هم‌خوان نیست")
    cause, o2 = found
    tools = tl.get("options")
    if not isinstance(tools, list) or len(set(tools)) != C.TOOLS["pick"] or any(t not in TOOL for t in tools):
        raise ValidationError("ابزارهای انتخاب‌شده نامعتبر است")
    o4 = S4_OPT.get(s4.get("option"))
    if not o4:
        raise ValidationError("انتخاب صحنه ۴ نامعتبر")

    counts = {a: 0.0 for a in C.APPROACHES}
    for o in (o1, o2, o4):
        counts[o["_tag"]] += 1.0
    for t in tools:
        counts[TOOL[t]["_tag"]] += 0.5
    shares = _shares(counts, list(C.APPROACHES))
    risk = (o1["_risk"] + o2["_risk"] + o4["_risk"]) / 3
    variety = len({o1["_tag"], o2["_tag"], o4["_tag"], *[TOOL[t]["_tag"] for t in tools]})
    times = [_t(s1), _t(s2), _t(tl), _t(s4)]

    choices = [("clue", c, "1", i, 0) for i, c in enumerate(clues)]
    choices += [("scene1", o1["id"], o1["_tag"], 0, _t(s1)),
                ("scene2", o2["id"], f"{cause}:{o2['_tag']}", 1, _t(s2))]
    choices += [("tool", t, TOOL[t]["_tag"], 2 + i, _t(tl)) for i, t in enumerate(tools)]
    choices += [("scene4", o4["id"], o4["_tag"], 4, _t(s4))]

    points = (POINTS["clue"] * len(clues) + POINTS["decision"] * 3 + POINTS["tools"] + POINTS["stage_complete"])
    assessment = {
        "approach_shares": shares, "risk": round(risk, 3), "clues_viewed": len(clues),
        "variety": variety, "cause": cause,
        "decisions": [
            {"scene": "scene1", "id": o1["id"], "title": o1["title"], "approach": o1["_tag"]},
            {"scene": "scene2", "id": o2["id"], "title": o2["title"], "approach": o2["_tag"]},
            {"scene": "scene4", "id": o4["id"], "title": o4["title"], "approach": o4["_tag"]},
        ],
        "tools": [{"id": t, "title": TOOL[t]["title"], "approach": TOOL[t]["_tag"]} for t in tools],
        "ending": o4["ending"],
        "avg_decision_ms": round(sum(times) / len(times)),
    }
    return {"assessment": assessment, "points": points, "choices": choices,
            "duration_ms": _int(payload.get("duration_ms", 0), 0, 3_600_000, "duration")}


# ================================================================== مرحله ۳ — مأموریت‌ها
def eval_pattern(puzzle_id, option_id, attempt_no):
    p = PATTERN.get(puzzle_id)
    if not p:
        raise ValidationError("معما نامعتبر")
    if option_id not in {o["id"] for o in p["options"]}:
        raise ValidationError("گزینه نامعتبر")
    if attempt_no > 2:
        raise ValidationError("تعداد تلاش‌ها تمام شده است")
    correct = option_id == p["_correct"]
    final = correct or attempt_no >= 2
    pts = 0
    if correct:
        pts = POINTS["pattern_first"] if attempt_no == 1 else POINTS["pattern_second"]
    elif final:
        pts = POINTS["pattern_fail"]
    return {"correct": correct, "final": final, "attempt_no": attempt_no,
            "hint": p["hint"] if (not correct and not final) else None,
            "reveal": p["_correct"] if (final and not correct) else None,
            "points": pts, "score": 1.0 if (correct and attempt_no == 1) else 0.6 if correct else 0.0}


def eval_sort(placement, attempt_no):
    if not isinstance(placement, dict) or set(placement) != set(SORT_ITEM):
        raise ValidationError("همه‌ی ابزارها باید در قفسه‌ها قرار بگیرند")
    if any(b not in SORT_BIN for b in placement.values()):
        raise ValidationError("قفسه نامعتبر")
    if attempt_no > 2:
        raise ValidationError("تعداد تلاش‌ها تمام شده است")
    per_item = {i: placement[i] == SORT_ITEM[i]["_bin"] for i in SORT_ITEM}
    ok = sum(per_item.values())
    perfect = ok == SORT_TOTAL
    final = perfect or attempt_no >= 2
    pts = 0
    if final:
        pts = POINTS["sort_item"] * ok + (POINTS["sort_bonus"] if perfect else 0)
    return {"correct": perfect, "final": final, "attempt_no": attempt_no, "per_item": per_item,
            "correct_count": ok, "total": SORT_TOTAL, "points": pts,
            "correct_bins": {i: SORT_ITEM[i]["_bin"] for i in SORT_ITEM} if (final and not perfect) else None}


def _design_metrics(placed, theme_id, title):
    items = [p["item"] for p in placed]
    distinct = list(dict.fromkeys(items))
    cats = {DESIGN_ITEM[i]["cat"] for i in distinct}
    rarity = sum(max(0, DESIGN_ITEM[i]["_rarity"] - 1) for i in distinct)
    w, h = C.DESIGN["canvas"]["w"], C.DESIGN["canvas"]["h"]
    quads = {(p["x"] >= w / 2, p["y"] >= h / 2) for p in placed}
    theme_cats = set(THEME[theme_id]["cats"]) if theme_id in THEME else set()
    theme_match = (sum(1 for i in items if DESIGN_ITEM[i]["cat"] in theme_cats) / len(items)) if items else 0
    has_title = len((title or "").strip()) >= 2
    fluency = min(len(items), 8) / 8
    flexibility = min(len(cats), 4) / 4
    originality = min(rarity, 6) / 6
    elaboration = 0.4 * has_title + 0.3 * (len(quads) >= 3) + 0.3 * (theme_match >= 0.5)
    index = 100 * (0.25 * fluency + 0.30 * flexibility + 0.25 * originality + 0.20 * elaboration)
    return {"count": len(items), "distinct": len(distinct), "categories": sorted(cats), "rarity": rarity,
            "quadrants": len(quads), "theme": theme_id, "theme_match": round(theme_match, 2), "has_title": has_title,
            "fluency": round(fluency, 2), "flexibility": round(flexibility, 2), "originality": round(originality, 2),
            "elaboration": round(elaboration, 2), "index": round(index, 1)}


def eval_design(placed, theme_id, title, attempt_no, prev_detail=None):
    if theme_id not in THEME:
        raise ValidationError("تم نامعتبر")
    if not isinstance(placed, list) or not (C.DESIGN["min_items"] <= len(placed) <= C.DESIGN["max_items"]):
        raise ValidationError(f"تعداد آیتم‌ها باید بین {C.DESIGN['min_items']} و {C.DESIGN['max_items']} باشد")
    if attempt_no > 2:
        raise ValidationError("تعداد تلاش‌ها تمام شده است")
    clean = []
    for p in placed:
        if not isinstance(p, dict) or p.get("item") not in DESIGN_ITEM:
            raise ValidationError("آیتم نامعتبر")
        clean.append({"item": p["item"], "x": _int(p.get("x", 0), 0, C.DESIGN["canvas"]["w"], "x"),
                      "y": _int(p.get("y", 0), 0, C.DESIGN["canvas"]["h"], "y")})
    title = (title or "").strip()[:40]
    m = _design_metrics(clean, theme_id, title)

    suggestion = None
    if attempt_no == 1:
        missing = [c for c in C.DESIGN_CATEGORIES if c not in m["categories"]]
        if len(m["categories"]) < 4 and missing:
            cat = missing[0]
            suggestion = {"type": "category", "cat": cat,
                          "text": f"غرفه‌ات جذاب است! اگر چیزی از دسته‌ی «{C.DESIGN_CATEGORIES[cat]}» هم اضافه کنی چه می‌شود؟"}
        elif not m["has_title"]:
            suggestion = {"type": "title", "cat": None, "text": "غرفه‌ات تنوع خوبی دارد. یک اسم هم برایش انتخاب کن تا شخصیت بگیرد."}
    can_revise = attempt_no == 1 and suggestion is not None

    acted = None
    pts = POINTS["design_item"] * min(len(clean), 10) + (POINTS["design_title"] if m["has_title"] else 0)
    if attempt_no == 2 and prev_detail:
        sug = prev_detail.get("suggestion")
        prev_m = prev_detail.get("metrics", {})
        acted = False
        if sug and sug["type"] == "category":
            acted = sug["cat"] in m["categories"]
        elif sug and sug["type"] == "title":
            acted = m["has_title"]
        pts = max(0, pts - (POINTS["design_item"] * min(prev_m.get("count", 0), 10) + (POINTS["design_title"] if prev_m.get("has_title") else 0)))
        pts += POINTS["design_revise"]
    final = attempt_no == 2 or not can_revise
    return {"correct": None, "final": final, "attempt_no": attempt_no, "metrics": m, "suggestion": suggestion,
            "can_revise": can_revise, "acted_on_feedback": acted, "points": pts, "placed": clean, "title": title}


_DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
_BASE_OPEN = {"straight": [0, 2], "corner": [0, 1], "tee": [0, 1, 3]}


def _openings(tile_type, rot):
    return {(d + rot) % 4 for d in _BASE_OPEN[tile_type]}


def eval_circuit(rotations, attempt_no):
    n = C.CIRCUIT["rows"] * C.CIRCUIT["cols"]
    if not isinstance(rotations, list) or len(rotations) != n or any(not isinstance(r, int) or not 0 <= r <= 3 for r in rotations):
        raise ValidationError("وضعیت مدار نامعتبر")
    if attempt_no > 12:
        raise ValidationError("تعداد تلاش‌ها تمام شده است")
    rows, cols = C.CIRCUIT["rows"], C.CIRCUIT["cols"]
    tiles = C.CIRCUIT["tiles"]
    op = [_openings(tiles[i]["type"], rotations[i]) for i in range(n)]
    powered, stack = set(), []
    if 3 in op[0]:
        powered.add(0)
        stack.append(0)
    while stack:
        i = stack.pop()
        r, c = divmod(i, cols)
        for d in op[i]:
            nr, nc = r + _DIRS[d][0], c + _DIRS[d][1]
            if 0 <= nr < rows and 0 <= nc < cols:
                j = nr * cols + nc
                if j not in powered and (d + 2) % 4 in op[j]:
                    powered.add(j)
                    stack.append(j)
    last = n - 1
    solved = last in powered and 1 in op[last]
    pts = 0
    if solved:
        pts = POINTS["circuit_first"] if attempt_no == 1 else POINTS["circuit_later"]
    elif attempt_no <= 3:
        pts = POINTS["circuit_try"]
    return {"correct": solved, "final": solved, "attempt_no": attempt_no, "powered": sorted(powered),
            "hint": C.CIRCUIT["hint"] if (not solved and attempt_no >= 3) else None, "points": pts}


def circuit_start_solved():
    """برای تست: آیا حالت شروع مدار خودش حل‌شده است؟"""
    return eval_circuit([t["rot"] for t in C.CIRCUIT["tiles"]], 1)["correct"]


def stage3_missing(attempts, choices):
    """مأموریت‌های ناتمام مرحله ۳ (برای اجازه‌ی تکمیل مرحله)."""
    missing = []
    for pid in PATTERN:
        rows = attempts.get(pid, [])
        if not rows or not rows[-1]["detail"].get("final"):
            missing.append(pid)
    for tid in ("sort",):
        rows = attempts.get(tid, [])
        if not rows or not rows[-1]["detail"].get("final"):
            missing.append(tid)
    rows = attempts.get("design", [])
    declined = any(c["choice_key"] == "design_revise" and c["value"] == "declined" for c in choices)
    if not rows or not (rows[-1]["detail"].get("final") or declined):
        missing.append("design")
    return missing


def evaluate_stage3(attempts, choices):
    # --- استدلال الگو
    num = den = 0.0
    pattern_detail = []
    for pid, p in PATTERN.items():
        rows = attempts.get(pid, [])
        s = rows[-1]["detail"].get("score", 0.0) if rows else 0.0
        num += p["_weight"] * s
        den += p["_weight"]
        pattern_detail.append({"id": pid, "attempts": len(rows), "first_try": bool(rows and rows[0]["is_correct"]),
                               "solved": bool(rows and rows[-1]["is_correct"])})
    reasoning = round(100 * num / den, 1) if den else None

    # --- سازمان‌دهی
    srows = attempts.get("sort", [])
    organization = sort_detail = None
    if srows:
        a1 = srows[0]["detail"]["correct_count"] / SORT_TOTAL
        a2 = srows[-1]["detail"]["correct_count"] / SORT_TOTAL
        organization = round(100 * (0.6 * a1 + 0.4 * a2), 1)
        sort_detail = {"first": srows[0]["detail"]["correct_count"], "final": srows[-1]["detail"]["correct_count"],
                       "total": SORT_TOTAL, "attempts": len(srows)}

    # --- طراحی
    drows = attempts.get("design", [])
    creative = design_detail = None
    revised = len(drows) > 1
    if drows:
        m = drows[-1]["detail"]["metrics"]
        creative = m["index"]
        design_detail = {**m, "revised": revised, "title": drows[-1]["detail"].get("title", "")}

    # --- مدار (اختیاری)
    crows = attempts.get("circuit", [])
    spatial = circuit_detail = None
    if crows:
        solved = bool(crows[-1]["is_correct"])
        n = len(crows)
        spatial = 100.0 if (solved and n == 1) else 70.0 if (solved and n <= 3) else 45.0 if solved else 20.0
        circuit_detail = {"attempts": n, "solved": solved}

    # --- یادگیری از بازخورد
    opportunities = []  # هر مورد: مقدار بهبود بین ۰ و ۱
    for pid in PATTERN:
        rows = attempts.get(pid, [])
        if rows and not rows[0]["is_correct"]:
            opportunities.append(1.0 if (len(rows) > 1 and rows[-1]["is_correct"]) else 0.0)
    if srows and srows[0]["detail"]["correct_count"] < SORT_TOTAL:
        a1c, a2c = srows[0]["detail"]["correct_count"], srows[-1]["detail"]["correct_count"]
        opportunities.append(max(0.0, (a2c - a1c) / (SORT_TOTAL - a1c)) if len(srows) > 1 else 0.0)
    if revised:
        opportunities.append(1.0 if drows[-1]["detail"].get("acted_on_feedback") else 0.0)
    if crows and not crows[0]["is_correct"]:
        opportunities.append(1.0 if crows[-1]["is_correct"] else 0.0)
    learning = round(100 * sum(opportunities) / len(opportunities), 1) if opportunities else None
    improved = sum(1 for o in opportunities if o > 0)

    # --- تمایل به ادامه (انتخاب آزادانه)
    bonus = next((c["value"] for c in choices if c["choice_key"] == "bonus_circuit"), None)
    stations = [c["item_id"] for c in sorted(choices, key=lambda c: c["order_index"]) if c["choice_key"] == "station_open"]
    order = list(dict.fromkeys(stations))

    pts = sum(r["detail"].get("points", 0) for rows in attempts.values() for r in rows) + POINTS["stage_complete"]
    assessment = {
        "performance": {"reasoning": reasoning, "organization": organization, "creative_design": creative, "spatial": spatial},
        "learning_from_feedback": learning, "learning_opportunities": len(opportunities), "learning_improved": improved,
        "details": {"patterns": pattern_detail, "sort": sort_detail, "design": design_detail, "circuit": circuit_detail},
        "engagement": {"bonus_circuit": bonus, "design_revised": revised, "stations_order": order},
    }
    return {"assessment": assessment, "points": int(round(pts)), "duration_ms": 0}


# ================================================================== مرحله ۴
def evaluate_stage4(payload):
    worlds = payload.get("worlds")
    gems = payload.get("gems")
    if not isinstance(worlds, list) or len(worlds) != C.WORLD_PICKS:
        raise ValidationError(f"باید دقیقاً {C.WORLD_PICKS} دنیا انتخاب شود")
    ids = [w.get("id") if isinstance(w, dict) else None for w in worlds]
    if len(set(ids)) != len(ids) or any(i not in WORLD for i in ids):
        raise ValidationError("دنیای انتخاب‌شده نامعتبر")
    if not isinstance(gems, dict) or set(gems) != set(C.MOTIVES):
        raise ValidationError("جواهرها نامعتبر")
    g = {k: _int(v, 0, C.GEMS, "gem") for k, v in gems.items()}
    if sum(g.values()) != C.GEMS:
        raise ValidationError(f"باید دقیقاً {C.GEMS} جواهر تقسیم شود")

    vec = _zero()
    for rank, wid in enumerate(ids):
        weight = C.WORLD_PICKS - rank
        for letter, w in _normalize(WORLD[wid]["_weights"]).items():
            vec[letter] += weight * w
    choices = [("world_rank", wid, str(i + 1), i, _t(worlds[i])) for i, wid in enumerate(ids)]
    choices += [("gems", k, str(v), i, 0) for i, (k, v) in enumerate(g.items())]
    points = POINTS["world"] * C.WORLD_PICKS + POINTS["compass"] + POINTS["stage_complete"]
    assessment = {"interest_shares": _shares(vec, C.RIASEC), "worlds": ids, "gems": g}
    return {"assessment": assessment, "points": points, "choices": choices,
            "duration_ms": _int(payload.get("duration_ms", 0), 0, 3_600_000, "duration")}


# ================================================================== نشان‌ها
def badges_for(stage, assessments, attempts):
    """نشان‌هایی که با تکمیل این مرحله به‌دست می‌آیند؛ [(key, stage)]"""
    out = []
    a = assessments.get(stage, {})
    if stage == 1 and a.get("visited", 0) >= 5:
        out.append("explorer")
    if stage == 2:
        out.append("city_savior")
        if a.get("clues_viewed") == 3:
            out.append("detective")
    if stage == 3:
        pats = a["details"]["patterns"]
        if all(p["solved"] for p in pats):
            out.append("pattern_hunter")
        if all(p["first_try"] for p in pats):
            out.append("sharp_eye")
        sd = a["details"]["sort"]
        if sd and sd["final"] == sd["total"]:
            out.append("organizer")
        dd = a["details"]["design"]
        if dd and dd["count"] >= 6:
            out.append("idea_designer")
        if a.get("learning_improved", 0) >= 1:
            out.append("bounce_back")
        cd = a["details"]["circuit"]
        if cd and cd["solved"]:
            out.append("circuit_fixer")
    if stage == 4:
        out.append("future_seeker")
        out.append("full_journey")
    return out


# ================================================================== گزارش نهایی
PERF_LETTER = {"reasoning": "I", "organization": "C", "creative_design": "A", "spatial": "R"}
PERF_NAME = {"reasoning": "استدلال الگو", "organization": "دقت و سازمان‌دهی",
             "creative_design": "تنوع ایده در طراحی", "spatial": "مهارت فنی-فضایی"}
MISSION_NAME = {"reasoning": "الگوی گمشده", "organization": "سازمان‌دهی انبار",
                "creative_design": "طراحی غرفه", "spatial": "تعمیر مدار"}


def _risk_label(r):
    return "محتاط" if r < 0.35 else "ریسک‌پذیر" if r > 0.65 else "متعادل"


def _consistency_label(c):
    return "بسیار هم‌سو" if c >= 0.85 else "هم‌سو" if c >= 0.6 else "متنوع و هنوز در حال شکل‌گیری"


def _top_keys(d, n, tie=None):
    tie = tie or {}
    return [k for k, _ in sorted(d.items(), key=lambda kv: (-kv[1], -tie.get(kv[0], 0)))][:n]


def build_report(a, game):
    s1, s2, s3, s4 = a[1], a[2], a[3], a[4]
    perf = s3["performance"]

    # ---------- علاقه
    s1_sh, s4_sh = s1["interest_shares"], s4["interest_shares"]
    total = {k: 0.5 * s1_sh[k] + 0.5 * s4_sh[k] for k in C.RIASEC}
    interest_sh = _shares(total, C.RIASEC)
    interest_idx = _index(interest_sh)
    order = _top_keys(interest_sh, 6, tie=s4_sh)
    code = "".join(order[:3])
    consistency = _cosine(s1_sh, s4_sh)

    # ---------- رویکرد
    ap_sh = s2["approach_shares"]
    ap_idx = _index(ap_sh)
    ap_top = _top_keys(ap_sh, 2)

    # ---------- انگیزه (SDT)
    gem_sh = {k: v / C.GEMS for k, v in s4["gems"].items()}
    chip_total = sum(s1["motive_chips"].values())
    chip_sh = {k: (v / chip_total if chip_total else 0.0) for k, v in s1["motive_chips"].items()}
    w_chip = 0.3 if chip_total else 0.0
    motive_sh = {k: (1 - w_chip) * gem_sh[k] + w_chip * chip_sh[k] for k in C.MOTIVES}
    motive_top = _top_keys(motive_sh, 1)[0]

    # ---------- نقاط قوت احتمالی
    strengths = []
    d = s3["details"]
    if perf["reasoning"] is not None and perf["reasoning"] >= 70:
        n_first = sum(1 for p in d["patterns"] if p["first_try"])
        strengths.append({"title": "تشخیص الگو و استدلال منطقی",
                          "text": "در معماهای الگو دقیق و منظم فکر کردی.",
                          "evidence": f"{n_first} از {len(d['patterns'])} معما را در تلاش اول حل کردی."})
    if perf["organization"] is not None and perf["organization"] >= 70:
        sd = d["sort"]
        strengths.append({"title": "نظم و دسته‌بندی دقیق", "text": "ابزارها را با دقت خوبی دسته‌بندی کردی.",
                          "evidence": f"{sd['final']} از {sd['total']} ابزار در جای درست قرار گرفت."})
    if perf["creative_design"] is not None and perf["creative_design"] >= 60:
        dd = d["design"]
        strengths.append({"title": "ایده‌پردازی و تنوع در طراحی",
                          "text": "در طراحی غرفه تنوع و ابتکار نشان دادی.",
                          "evidence": f"از {len(dd['categories'])} دسته‌ی مختلف و {dd['count']} آیتم استفاده کردی."})
    if perf["spatial"] is not None and perf["spatial"] >= 70:
        strengths.append({"title": "درک فنی و فضایی", "text": "مدار برق را با تعداد تلاش کم روشن کردی.",
                          "evidence": f"مدار را در {d['circuit']['attempts']} تلاش روشن کردی."})
    if s3["learning_from_feedback"] is not None and s3["learning_from_feedback"] >= 60:
        strengths.append({"title": "یادگرفتن از بازخورد",
                          "text": "وقتی راهنمایی گرفتی، نتیجه‌ات را بهتر کردی.",
                          "evidence": f"در {s3['learning_improved']} از {s3['learning_opportunities']} فرصت اصلاح، نتیجه‌ات بهتر شد."})
    if ap_sh[ap_top[0]] >= 0.3:
        ap = C.APPROACHES[ap_top[0]]
        strengths.append({"title": f"شیوه‌ی حل مسئله: {ap['title']}", "text": ap["desc"] + ".",
                          "evidence": f"در مأموریت نجات، حدود {round(ap_sh[ap_top[0]] * 100)}٪ تصمیم‌هایت این رویکرد را داشت."})
    if s2["clues_viewed"] == 3:
        strengths.append({"title": "کنجکاوی پیش از تصمیم", "text": "قبل از اقدام اطلاعات جمع کردی.",
                          "evidence": "هر سه سرنخ شهر را بررسی کردی."})
    strengths = strengths[:5]

    # ---------- نیازمند تجربه بیشتر + هم‌خوانی علاقه و عملکرد
    needs, cross = [], []
    for key, letter in PERF_LETTER.items():
        idx, sc = interest_idx[letter], perf[key]
        if sc is None:
            if idx >= 60:
                needs.append({"title": f"{C.RIASEC_FA[letter]}: عملکرد سنجیده نشد",
                              "text": f"به این حوزه علاقه نشان دادی اما «{MISSION_NAME[key]}» را انجام ندادی. با یک پروژه‌ی کوچک آن را امتحان کن."})
            cross.append({"letter": letter, "interest": idx, "performance": None, "verdict": "unmeasured"})
            continue
        if idx >= 60 and sc < 55:
            needs.append({"title": f"{C.RIASEC_FA[letter]}: علاقه‌ی بیشتر از تجربه",
                          "text": f"علاقه‌ات به این حوزه بالاست، اما عملکرد این بازی در «{MISSION_NAME[key]}» کمتر بود. این لزوماً کمبود توانایی نیست؛ شاید فقط تمرین بیشتری لازم داری."})
            verdict = "interest_gt_perf"
        elif idx < 40 and sc >= 70:
            needs.append({"title": f"{C.RIASEC_FA[letter]}: توانایی بدون علاقه‌ی فعلی",
                          "text": f"در «{MISSION_NAME[key]}» خوب عمل کردی ولی علاقه‌ات به آن کم بود. با یک پروژه‌ی کوچک بسنج که واقعاً دوستش داری یا نه."})
            verdict = "perf_gt_interest"
        elif idx >= 60 and sc >= 55:
            verdict = "aligned"
        else:
            verdict = "neutral"
        cross.append({"letter": letter, "interest": idx, "performance": sc, "verdict": verdict})
    for letter in ("S", "E"):
        if interest_idx[letter] >= 60:
            needs.append({"title": f"{C.RIASEC_FA[letter]}: فقط علاقه سنجیده شد",
                          "text": "عملکرد در کارهای اجتماعی و رهبری را این بازی نمی‌سنجد. تجربه‌ی واقعی (کار گروهی، داوطلبی، پروژه) بهترین راه شناخت است."})
    if consistency < 0.5:
        needs.append({"title": "علایق هنوز در حال شکل‌گیری است",
                      "text": "انتخاب‌هایت در جزیره و سرزمین آینده تفاوت‌های زیادی داشت. نگران نشو؛ تجربه‌ی بیشتر کمک می‌کند علایقت روشن‌تر شود."})
    if s3["learning_from_feedback"] is not None and s3["learning_from_feedback"] < 40:
        needs.append({"title": "استفاده از بازخورد",
                      "text": "پس از دریافت راهنمایی، نتیجه‌ات تغییر چندانی نکرد. دفعه‌ی بعد کمی بیشتر روی راهنمایی مکث کن."})
    needs = needs[:6]

    # ---------- مأموریت‌ها
    missions = []
    if perf["reasoning"] is not None:
        missions.append({"id": "reasoning", "title": MISSION_NAME["reasoning"], "score": perf["reasoning"], "band": _band(perf["reasoning"]),
                         "metrics": [{"label": "حل در تلاش اول", "value": f"{sum(1 for p in d['patterns'] if p['first_try'])} از {len(d['patterns'])}"},
                                     {"label": "حل نهایی", "value": f"{sum(1 for p in d['patterns'] if p['solved'])} از {len(d['patterns'])}"}]})
    if perf["organization"] is not None:
        sd = d["sort"]
        missions.append({"id": "organization", "title": MISSION_NAME["organization"], "score": perf["organization"], "band": _band(perf["organization"]),
                         "metrics": [{"label": "درست در تلاش اول", "value": f"{sd['first']} از {sd['total']}"},
                                     {"label": "درست در پایان", "value": f"{sd['final']} از {sd['total']}"}]})
    if perf["creative_design"] is not None:
        dd = d["design"]
        missions.append({"id": "creative_design", "title": MISSION_NAME["creative_design"], "score": perf["creative_design"], "band": _band(perf["creative_design"]),
                         "metrics": [{"label": "تعداد آیتم", "value": str(dd["count"])},
                                     {"label": "تنوع دسته‌ها", "value": f"{len(dd['categories'])} از {len(C.DESIGN_CATEGORIES)}"},
                                     {"label": "ابتکار (آیتم‌های غیرمعمول)", "value": f"{round(dd['originality'] * 100)}٪"},
                                     {"label": "بازطراحی با بازخورد", "value": "بله" if dd["revised"] else "خیر"}]})
    if perf["spatial"] is not None:
        cd = d["circuit"]
        missions.append({"id": "spatial", "title": MISSION_NAME["spatial"] + " (اختیاری)", "score": perf["spatial"], "band": _band(perf["spatial"]),
                         "metrics": [{"label": "تعداد تلاش", "value": str(cd["attempts"])},
                                     {"label": "نتیجه", "value": "روشن شد" if cd["solved"] else "روشن نشد"}]})

    # ---------- ترجیحات فعالیتی
    prefs = {
        "loved_zones": [ZONE[z]["title"] for z in s1["loved"]],
        "starred_zones": [ZONE[z]["title"] for z in s1["stars"]],
        "worlds": [WORLD[w]["title"] for w in s4["worlds"]],
        "first_station": s3["engagement"]["stations_order"][0] if s3["engagement"]["stations_order"] else None,
        "stations_order": s3["engagement"]["stations_order"],
        "chose_bonus": s3["engagement"]["bonus_circuit"] == "accepted",
        "explored_zones": s1["visited"],
    }

    # ---------- مسیرها
    recs = rank_paths(interest_sh, ap_sh, perf, s1, s4, s2, interest_idx)

    return {
        "version": C.CONTENT_VERSION,
        "headline": {"holland_code": code, "top_letters": [{"letter": l, "title": C.RIASEC_FA[l]} for l in order[:3]]},
        "interest": {"index": interest_idx, "shares": interest_sh, "stage1": s1_sh, "stage4": s4_sh,
                     "consistency": round(consistency, 2), "consistency_label": _consistency_label(consistency), "order": order},
        "approach": {"index": ap_idx, "shares": ap_sh, "top": ap_top, "risk": {"value": s2["risk"], "label": _risk_label(s2["risk"])},
                     "clues_viewed": s2["clues_viewed"], "variety": s2["variety"], "decisions": s2["decisions"], "tools": s2["tools"],
                     "ending": s2["ending"], "avg_decision_ms": s2["avg_decision_ms"]},
        "motives": {"shares": motive_sh, "top": motive_top, "gems": s4["gems"], "chips": s1["motive_chips"]},
        "performance": {"scores": perf, "bands": {k: _band(v) for k, v in perf.items()}, "missions": missions,
                        "learning": {"score": s3["learning_from_feedback"], "band": _band(s3["learning_from_feedback"]),
                                     "opportunities": s3["learning_opportunities"], "improved": s3["learning_improved"]},
                        "cross_check": cross,
                        "unmeasured_note": "توانایی‌های اجتماعی، رهبری و کارآفرینی در این بازی سنجیده نمی‌شوند؛ فقط علاقه‌ی تو به آن‌ها ثبت شده است."},
        "activity_preferences": prefs,
        "strengths": strengths, "needs_experience": needs, "recommendations": recs, "game": game,
        "disclaimer": "این گزارش بر اساس رفتار تو در همین بازی ۵ تا ۱۰ دقیقه‌ای ساخته شده و تشخیص قطعی استعداد، هوش یا شخصیت نیست. آن را نقطه‌ی شروع گفت‌وگو با خودت و مشاور بدان و مسیرها را با پروژه‌های کوچک امتحان کن.",
    }


def rank_paths(interest_sh, ap_sh, perf, s1, s4, s2, interest_idx):
    perf_n = {k: (v / 100 if v is not None else None) for k, v in perf.items()}
    scored = []
    for p in PATHS:
        im = _cosine(p["riasec"], interest_sh)
        am = _cosine(p["approach"], ap_sh)
        num = den = 0.0
        unmeasured = []
        for dim, w in p["demands"].items():
            v = perf_n.get(dim)
            den += w
            if v is None:
                num += w * 0.5
                if w >= 0.5:
                    unmeasured.append(dim)
            else:
                num += w * v
        pf = num / den if den else 0.5
        scored.append({"path": p, "im": im, "am": am, "pf": pf, "unmeasured": unmeasured,
                       "score": 100 * (0.55 * im + 0.25 * am + 0.20 * pf)})
    scored.sort(key=lambda s: -s["score"])
    chosen, fam = [], {}
    for s in scored:
        f = s["path"]["family"]
        if fam.get(f, 0) >= MAX_PER_FAMILY:
            continue
        chosen.append(s)
        fam[f] = fam.get(f, 0) + 1
        if len(chosen) == 3:
            break

    out = []
    for rank, s in enumerate(chosen, 1):
        p = s["path"]
        reasons, cautions = [], []
        main = max(p["riasec"], key=p["riasec"].get)
        zones = [ZONE[z]["title"] for z in s1["stars"] if main in ZONE[z]["_weights"]]
        worlds = [WORLD[w]["title"] for w in s4["worlds"] if main in WORLD[w]["_weights"]]
        if interest_idx[main] >= 50 or zones or worlds:
            bits = []
            if zones:
                bits.append("ستاره‌ات را روی «" + "» و «".join(zones) + "» گذاشتی")
            if worlds:
                bits.append("«" + "» و «".join(worlds) + "» را در سرزمین آینده برگزیدی")
            reasons.append(f"علاقه‌ی تو به حوزه‌ی «{C.RIASEC_FA[main]}» در انتخاب‌هایت دیده شد" + (": " + " و ".join(bits) + "." if bits else "."))
        top_ap = [a for a in sorted(p["approach"], key=p["approach"].get, reverse=True) if ap_sh.get(a, 0) >= 0.2]
        if top_ap:
            a = top_ap[0]
            reasons.append(f"در مأموریت نجات از رویکرد «{C.APPROACHES[a]['title']}» زیاد استفاده کردی؛ این رویکرد در این مسیر هم کاربرد دارد.")
        for dim, w in sorted(p["demands"].items(), key=lambda kv: -kv[1]):
            v = perf.get(dim)
            if w < 0.5:
                continue
            if v is None:
                cautions.append(f"«{PERF_NAME[dim]}» در این بازی سنجیده نشد؛ با پروژه‌ی کوچک زیر امتحانش کن.")
            elif v >= 65:
                reasons.append(f"در «{MISSION_NAME[dim]}» عملکرد خوبی نشان دادی و این مهارت در این مسیر مهم است.")
            elif v < 50:
                cautions.append(f"در «{MISSION_NAME[dim]}» عملکردت کمتر بود؛ این مهارت با تمرین رشد می‌کند و ثابت نیست.")
        if not reasons:
            reasons.append("ترکیب کلی علایق و رویکرد تو با این مسیر نزدیک است.")
        out.append({"rank": rank, "key": p["key"], "title": p["title"], "summary": p["summary"], "family": p["family"],
                    "match": round(s["score"]), "interest_match": round(100 * s["im"]), "approach_match": round(100 * s["am"]),
                    "performance_fit": round(100 * s["pf"]), "reasons": reasons[:3], "cautions": cautions[:2],
                    "project": p["project"], "job_ref": p["job_ref"]})
    return out

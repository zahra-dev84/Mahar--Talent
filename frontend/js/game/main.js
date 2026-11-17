import { DEFS, guide, icon, badgeArt } from "./art.js";
import { welcomeScene, islandScene, cityScene, workshopBg, futureScene } from "./scenes.js";
import { api, ApiError, getToken, goLogin } from "./api.js";
import { h, fa, sleep, toast, confetti, animateNumber, now } from "./ui.js";
import { runStage1 } from "./stage1.js";
import { runStage2 } from "./stage2.js";
import { runStage3 } from "./stage3.js";
import { runStage4 } from "./stage4.js";
import { renderReport } from "./report.js";

const app = document.getElementById("app");
const wipeEl = document.getElementById("wipe");
document.getElementById("defs").innerHTML = DEFS;

const G = { content: null, user: null, run: null, score: 0, badges: [], done: new Set() };

function mount(node) {
  app.replaceChildren(node);
  window.scrollTo({ top: 0 });
}
async function transition(build) {
  wipeEl.classList.add("on");
  await sleep(560);
  mount(await build());
  await sleep(60);
  wipeEl.classList.remove("on");
}
const fail = (e) => toast(e instanceof ApiError ? e.message : "مشکلی پیش آمد. دوباره تلاش کن.", "error");

// ---------------------------------------------------------------- HUD
function buildHud(stageNo) {
  const stages = G.content.stages;
  const steps = stages.map((s, i) => {
    const n = i + 1;
    const cls = G.done.has(n) ? "is-done" : n === stageNo ? "is-current" : "";
    return h("div", { class: `step ${cls}`, title: s.title },
      h("span", { class: "step__dot" }, G.done.has(n) ? "✓" : fa(n)),
      h("span", { class: "step__label" }, s.title),
      n < stages.length ? h("span", { class: "step__bar" }, h("i")) : null);
  });
  const scoreVal = h("b", {}, fa(G.score));
  const badges = h("div", { class: "hud__badges" });
  const addBadge = (b) => badges.append(h("span", { class: "mini", style: { "--bc": b.color }, title: b.title, html: icon(b.icon) }));
  G.badges.forEach(addBadge);
  const el = h("header", { class: "hud" },
    h("button", { class: "hud__home", onclick: () => confirmExit(), "aria-label": "خروج از بازی" }, "Mahar"),
    h("div", { class: "hud__steps" }, steps),
    badges,
    h("div", { class: "hud__score", title: "امتیاز بازی" }, h("span", { html: icon("star") }), scoreVal));
  let shown = G.score;
  return {
    el, addBadge,
    setScore(v) { animateNumber(scoreVal, shown, v); shown = v; },
    bump(n) { this.setScore(shown + n); },
  };
}

function confirmExit() {
  const m = h("div", { class: "modal" }, h("div", { class: "sheet" }, h("div", { class: "sheet__body" },
    h("h3", {}, "خروج از بازی؟"),
    h("p", {}, "پیشرفتت تا پایان مرحله‌ی قبل ذخیره شده است. بعداً می‌توانی از همین‌جا ادامه بدهی."),
    h("div", { class: "row" },
      h("button", { class: "btn btn--primary", onclick: () => { location.href = "index.html"; } }, "خروج"),
      h("button", { class: "btn btn--ghost", onclick: () => m.remove() }, "ادامه‌ی بازی")))));
  document.body.append(m);
}

// ---------------------------------------------------------------- راهنما
function guideStrip() {
  const av = h("div", { class: "guide-strip__av", html: guide("happy") });
  const bubble = h("div", { class: "bubble" });
  const el = h("div", { class: "guide-strip" }, av, bubble);
  return {
    el,
    say(text, mood = "happy") {
      av.innerHTML = guide(mood);
      bubble.replaceChildren(document.createTextNode(text));
      bubble.style.animation = "none"; void bubble.offsetWidth; bubble.style.animation = "";
    },
  };
}

// ---------------------------------------------------------------- صفحه‌ی خوش‌آمد
async function welcomeScreen() {
  const runs = await api.runs().catch(() => []);
  const active = runs.find((r) => r.status === "in_progress" && r.current_stage > 1);
  const completed = runs.filter((r) => r.status === "completed");
  const first = G.user?.firstName ? `${G.user.firstName} عزیز، ` : "";
  const start = h("button", { class: "btn btn--primary btn--big btn--pulse" }, active ? "شروع بازی جدید" : "شروع ماجراجویی");
  start.onclick = async () => { start.disabled = true; try { G.run = await api.createRun(); G.done = new Set(); G.score = 0; G.badges = []; await play(1); } catch (e) { fail(e); start.disabled = false; } };
  const actions = h("div", { class: "welcome__actions" });
  if (active) {
    const cont = h("button", { class: "btn btn--primary btn--big btn--pulse" }, `ادامه‌ی بازی (مرحله ${fa(active.current_stage)})`);
    cont.onclick = async () => {
      cont.disabled = true;
      try {
        const st = await api.resume(active.id);
        G.run = st.run; G.score = st.run.game_score; G.badges = st.badges;
        G.done = new Set(Object.keys(st.stage_points).map(Number));
        await play(st.run.current_stage);
      } catch (e) { fail(e); cont.disabled = false; }
    };
    start.classList.remove("btn--pulse"); start.classList.replace("btn--primary", "btn--ghost");
    actions.append(cont);
  }
  actions.append(start);
  const prev = completed.length ? h("div", { class: "prev-runs" }, h("h3", {}, "گزارش‌های قبلی"),
    completed.slice(0, 3).map((r) => h("div", { class: "prev-run" },
      h("span", {}, `${new Date(r.completed_at).toLocaleDateString("fa-IR")} · کد ${r.holland_code || "—"} · ${fa(r.game_score)} امتیاز`),
      h("button", { class: "btn btn--ghost", onclick: () => showReport(r.id) }, "مشاهده")))) : null;
  return h("main", { class: "screen welcome" },
    h("div", { class: "welcome__bg", html: welcomeScene() }),
    h("div", { class: "welcome__card" },
      h("div", { class: "welcome__guide", html: guide("cheer") }),
      h("h1", {}, "کشف دنیای توانایی‌ها"),
      h("p", {}, `${first}به یک ماجراجویی ۵ تا ۱۰ دقیقه‌ای خوش آمدی! در چهار مرحله محیط‌ها را کشف می‌کنی، شهری را نجات می‌دهی، در کارگاه دست‌به‌کار می‌شوی و در پایان گزارش خودشناسی و مسیرهای پیشنهادی‌ات را می‌گیری.`),
      h("div", { class: "welcome__stages" }, G.content.stages.map((s) => h("div", {}, h("b", {}, fa(s.id)), s.title))),
      actions, prev,
      h("p", { class: "welcome__note" }, "این بازی ابزار خودشناسی است، نه آزمون تشخیصی؛ جواب درست یا غلط ندارد. نتیجه فقط بر اساس رفتار تو در همین بازی ساخته می‌شود.")));
}

// ---------------------------------------------------------------- ورودی مرحله
const INTRO_ART = { 1: () => islandScene({}), 2: () => cityScene(), 3: () => workshopBg(), 4: () => futureScene({}) };

async function introScreen(n) {
  const s = G.content.stages[n - 1];
  const g = guideStrip();
  g.say(s.guide, n === 4 ? "cheer" : "happy");
  const go = h("button", { class: "btn btn--primary btn--big btn--pulse" }, n === 1 ? "بزن بریم!" : "آماده‌ام");
  const node = h("main", { class: "screen" }, buildHud(n).el,
    h("div", { class: "intro" },
      h("div", { class: "intro__card" },
        h("div", { class: "intro__art" }, h("div", { class: "intro__num" }, `مرحله ${fa(n)} از ${fa(4)}`), h("div", { html: INTRO_ART[n](), style: { height: "100%" } })),
        h("div", { class: "intro__body" }, h("h2", {}, s.title), h("div", { class: "intro__sub" }, s.subtitle),
          h("p", { class: "intro__story" }, s.story), g.el, go))));
  return { node, go };
}

// ---------------------------------------------------------------- اجرای مراحل
const RUNNERS = { 1: runStage1, 2: runStage2, 3: runStage3, 4: runStage4 };

function makeStageCtx(n) {
  const hud = buildHud(n);
  const g = guideStrip();
  const main = h("div", { class: "stage__main" });
  const sub = h("i");
  const root = h("main", { class: "screen stage" }, hud.el, h("div", { class: "substrip" }, sub), g.el, main);
  const t0 = now();
  const ctx = {
    content: G.content, run: G.run, root, main, hud, n, P: G.content.points,
    say: g.say, sub: (pct) => { sub.style.width = pct + "%"; },
    elapsed: () => Math.round(now() - t0),
    api: { ...api, attempt: (b) => api.attempt(G.run.id, b), choice: (b) => api.choice(G.run.id, b) },
    fail, mount: (node) => main.replaceChildren(node),
    // ثبت نهایی مرحله و نمایش خلاصه
    async finish(payload, extra = {}) {
      const res = await api.completeStage(G.run.id, n, { ...payload, duration_ms: ctx.elapsed() });
      G.score = res.game_score;
      G.done.add(n);
      hud.setScore(res.game_score);
      res.new_badges.forEach((b) => { G.badges.push(b); hud.addBadge(b); });
      return res;
    },
    summary(res, title, line) {
      return new Promise((resolve) => {
        confetti();
        const done = h("button", { class: "btn btn--primary btn--big", onclick: resolve }, n < 4 ? "برویم مرحله‌ی بعد" : "ساخت گزارش من");
        main.replaceChildren(h("div", { class: "summary" },
          h("h2", {}, title), h("p", { class: "hint" }, line),
          h("div", { class: "big" }, `+${fa(res.points)}`), h("div", { class: "hint" }, "امتیاز این مرحله"),
          res.new_badges.length ? h("div", { class: "newbadges" }, res.new_badges.map((b) => h("div", { class: "nb" }, h("div", { html: badgeArt(b) }), h("b", {}, b.title), h("div", { class: "hint" }, b.desc)))) : null,
          done));
        ctx.say(n === 4 ? "تو تا آخر راه آمدی! حالا گزارشت را می‌سازم." : "عالی بود! ادامه بدهیم؟", "cheer");
        ctx.sub(100);
      });
    },
  };
  return { ctx, root };
}

async function play(from) {
  for (let n = from; n <= 4; n++) {
    const { node, go } = await introScreen(n);
    await transition(() => node);
    await new Promise((r) => (go.onclick = r));
    try { await api.startStage(G.run.id, n); } catch (e) { fail(e); return welcomeAgain(); }
    const { ctx, root } = makeStageCtx(n);
    await transition(() => root);
    try { await RUNNERS[n](ctx); } catch (e) { fail(e); console.error(e); return welcomeAgain(); }
  }
  await showReport(G.run.id, true);
}

async function welcomeAgain() { await transition(welcomeScreen); }

async function showReport(runId, fresh = false) {
  const data = await api.report(runId).catch((e) => { fail(e); return null; });
  if (!data) return;
  history.replaceState(null, "", `game.html?report=${runId}`);
  await transition(() => renderReport(data.report, { content: G.content, fresh, hudScoreBack: () => { history.replaceState(null, "", "game.html"); transition(welcomeScreen); } }));
}

// ---------------------------------------------------------------- شروع
(async function boot() {
  if (!getToken()) return goLogin();
  try {
    [G.content, G.user] = await Promise.all([api.content(), api.me()]);
  } catch (e) {
    if (e.status === 401) return;
    mount(h("main", { class: "screen welcome" }, h("div", { class: "welcome__card" }, h("div", { class: "welcome__guide", html: guide("think") }),
      h("h1", {}, "اوه! ارتباط برقرار نشد"), h("p", {}, e.message || "بک‌اند را اجرا کن و دوباره تلاش کن."),
      h("button", { class: "btn btn--primary", onclick: () => location.reload() }, "تلاش دوباره"))));
    return;
  }
  const params = new URLSearchParams(location.search);
  if (params.get("report")) return showReport(Number(params.get("report")));
  mount(await welcomeScreen());
})();

// مرحله ۱ — جزیره انتخاب‌ها
import { islandScene, zoneArt } from "./scenes.js";
import { icon } from "./art.js";
import { h, fa, floatPoints, draggable, now, toast } from "./ui.js";

const NS = "http://www.w3.org/2000/svg";

export async function runStage1(ctx) {
  const { zones, reactions } = ctx.content.stage1;
  const motives = ctx.content.motives;
  const MAX = ctx.content.limits.stars;
  const titles = Object.fromEntries(zones.map((z) => [z.id, z.title]));
  const seen = new Map();       // zoneId -> {reaction, motive, dwell_ms, t_ms}
  const stars = [];             // zoneId[] به ترتیب قرار گرفتن
  const starTimes = {};
  let selectedStar = false;

  const wrap = h("div", { class: "scene-wrap scene-wrap--island", html: islandScene(titles) });
  const svg = wrap.querySelector("svg");
  const counter = h("span", { class: "pill" });
  const hintEl = h("span", { class: "hint" });
  const tray = h("div", { class: "tray", hidden: true });
  const cont = h("button", { class: "btn btn--primary btn--big btn--pulse", disabled: true }, "تأیید ستاره‌ها");
  ctx.main.append(h("div", { class: "chipbar" }, counter, hintEl), tray, wrap, h("div", { class: "row" }, cont));

  ctx.say("روی هر محیط کلیک کن و نگاهش کن. بعد از دیدن حداقل سه محیط، ستاره‌هایت را می‌دهم!", "happy");

  const zoneEl = (id) => svg.querySelector(`.zone[data-zone="${id}"]`);

  function updateUi() {
    const n = seen.size;
    counter.replaceChildren("بررسی‌شده: ", h("b", {}, `${fa(n)} از ${fa(zones.length)}`));
    ctx.sub((n / zones.length) * 50 + (stars.length / MAX) * 50);
    const canStar = n >= 3;
    tray.hidden = !canStar;
    hintEl.textContent = !canStar ? `حداقل ${fa(3 - n)} محیط دیگر را ببین تا ستاره‌ها باز شوند` :
      stars.length < MAX ? "ستاره‌ها را بکش و روی محیط‌های محبوبت بینداز (یا ستاره را بزن و بعد محیط را بزن)" : "همه‌ی ستاره‌ها گذاشته شد؛ می‌توانی جابه‌جایشان کنی.";
    cont.disabled = stars.length !== MAX;
    renderTray();
    renderStars();
  }

  function renderTray() {
    tray.replaceChildren(h("b", {}, "ستاره‌های طلایی:"));
    for (let i = 0; i < MAX; i++) {
      const used = i < stars.length;
      const s = h("div", { class: `tray__star ${used ? "is-used" : ""} ${selectedStar && !used && i === stars.length ? "is-selected" : ""}`, html: icon("star"), role: "button", tabindex: used ? -1 : 0, "aria-label": "ستاره" });
      if (!used) {
        draggable(s, {
          target: ".zone",
          onDrop: (t) => t && placeStar(t.dataset.zone),
          onClick: () => { selectedStar = !selectedStar; renderTray(); },
        });
        s.addEventListener("keydown", (e) => { if (e.key === "Enter") { selectedStar = !selectedStar; renderTray(); } });
      }
      tray.append(s);
    }
  }

  function renderStars() {
    svg.querySelectorAll(".zone-star").forEach((n) => n.remove());
    stars.forEach((zid) => {
      const g = zoneEl(zid);
      if (!g) return;
      const sc = Number(g.querySelector(".zone-body").getAttribute("transform").match(/scale\(([\d.]+)\)/)[1]);
      const star = document.createElementNS(NS, "g");
      star.setAttribute("class", "zone-star");
      star.setAttribute("transform", `translate(0 ${-205 * sc}) scale(1.5)`);
      star.innerHTML = `<g transform="translate(-24 -24) scale(.75)">${icon("star").replace(/<svg[^>]*>|<\/svg>/g, "")}</g>`;
      star.addEventListener("click", (e) => { e.stopPropagation(); removeStar(zid); });
      g.append(star);
    });
  }

  function placeStar(zid) {
    if (!zid || stars.includes(zid)) return;
    if (stars.length >= MAX) { toast("هر سه ستاره گذاشته شده. روی یک ستاره بزن تا برگردد."); return; }
    stars.push(zid);
    starTimes[zid] = ctx.elapsed();
    selectedStar = false;
    floatPoints(zoneEl(zid).getBoundingClientRect ? tray : tray, `+${fa(ctx.P.star)}`);
    ctx.hud.bump(ctx.P.star);
    if (stars.length === MAX) ctx.say("عالی! اگر نظرت عوض شد، ستاره را بزن تا برگردد. وگرنه تأیید کن.", "cheer");
    updateUi();
  }
  function removeStar(zid) {
    stars.splice(stars.indexOf(zid), 1);
    ctx.hud.bump(-ctx.P.star);
    updateUi();
  }

  // کلیک روی محیط: یا قرار دادن ستاره‌ی انتخاب‌شده، یا باز کردن پنجره‌ی بررسی
  svg.querySelectorAll(".zone").forEach((g) => {
    const open = () => {
      if (selectedStar && seen.size >= 3) return placeStar(g.dataset.zone);
      openPeek(g.dataset.zone);
    };
    g.addEventListener("click", open);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });

  function markZone(zid) {
    const g = zoneEl(zid);
    const info = seen.get(zid);
    g.classList.add("is-seen");
    const sc = Number(g.querySelector(".zone-body").getAttribute("transform").match(/scale\(([\d.]+)\)/)[1]);
    const mk = g.querySelector(".zone-mark");
    mk.setAttribute("transform", `translate(${70 * sc} ${-170 * sc})`);
    const ic = { love: "heart", ok: "check", no: "cross" }[info.reaction];
    mk.innerHTML = `<g class="mark"><circle r="20" fill="#0F172A" opacity=".85"/><g transform="translate(-14 -14) scale(.44)">${icon(ic).replace(/<svg[^>]*>|<\/svg>/g, "")}</g></g>`;
  }

  function openPeek(zid) {
    const z = zones.find((x) => x.id === zid);
    const prev = seen.get(zid);
    const opened = now();
    const state = { reaction: prev?.reaction || null, motive: prev?.motive || null };
    const body = h("div", { class: "sheet__body" });
    const modal = h("div", { class: "modal", onclick: (e) => e.target === modal && close() }, h("div", { class: "sheet", role: "dialog", "aria-label": z.title }, h("div", { class: "sheet__art", html: zoneArt(zid) }), body));
    const doneBtn = h("button", { class: "btn btn--primary", style: { width: "100%", marginTop: "16px" }, disabled: !state.reaction }, "ثبت و بازگشت به جزیره");
    const motiveBox = h("div");

    const drawMotive = () => {
      motiveBox.replaceChildren();
      if (state.reaction !== "love") { state.motive = null; return; }
      motiveBox.append(h("div", { class: "q" }, "چه چیزی این‌جا بیشتر جذبت می‌کند؟ (اختیاری)"),
        h("div", { class: "chips" }, Object.entries(motives).map(([k, m]) => h("button", {
          class: `chip ${state.motive === k ? "is-on" : ""}`, title: m.desc,
          onclick: () => { state.motive = state.motive === k ? null : k; drawMotive(); },
        }, m.title))));
    };
    const reactRow = h("div", { class: "react" }, Object.entries(reactions).map(([k, r]) => h("button", {
      class: `btn ${state.reaction === k ? "is-on" : ""}`, "data-v": k,
      onclick: (e) => {
        state.reaction = k;
        reactRow.querySelectorAll(".btn").forEach((b) => b.classList.toggle("is-on", b === e.currentTarget));
        doneBtn.disabled = false; drawMotive();
      },
    }, k === "love" ? "❤ " + r.title : k === "ok" ? "👍 " + r.title : "✕ " + r.title)));

    function close() { modal.remove(); }
    doneBtn.onclick = () => {
      const first = !seen.has(zid);
      seen.set(zid, { reaction: state.reaction, motive: state.motive, dwell_ms: Math.round(now() - opened) + (prev?.dwell_ms || 0), t_ms: ctx.elapsed() });
      if (first) { ctx.hud.bump(ctx.P.zone_visit); floatPoints(doneBtn, `+${fa(ctx.P.zone_visit)}`); }
      if (state.motive && !prev?.motive) ctx.hud.bump(ctx.P.motive_chip);
      markZone(zid);
      close();
      if (first && seen.size === 3) ctx.say("سه محیط را دیدی؛ ستاره‌های طلایی باز شدند!", "wow");
      else if (first && seen.size === zones.length) ctx.say("همه‌ی محیط‌ها را گشتی! کنجکاوی‌ات عالی است.", "cheer");
      updateUi();
    };
    body.append(h("h3", {}, z.title), h("p", {}, z.blurb),
      h("div", { class: "q" }, "این‌جا چه کارهایی می‌کنی؟"),
      h("ul", { class: "acts" }, z.activities.map((a) => h("li", {}, a))),
      h("div", { class: "q" }, "حس‌ات نسبت به این محیط چیست؟"), reactRow, motiveBox, doneBtn);
    drawMotive();
    document.body.append(modal);
  }

  updateUi();
  await new Promise((resolve) => {
    cont.onclick = async () => {
      cont.disabled = true;
      try {
        const payload = {
          zones: [...seen.entries()].map(([id, v]) => ({ id, ...v })),
          stars: stars.map((zone) => ({ zone, t_ms: starTimes[zone] || 0 })),
        };
        const res = await ctx.finish(payload);
        await ctx.summary(res, "جزیره را کشف کردی!", `${fa(seen.size)} محیط را دیدی و ستاره‌هایت را گذاشتی.`);
        resolve();
      } catch (e) { ctx.fail(e); cont.disabled = false; }
    };
  });
}

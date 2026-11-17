// مرحله ۴ — سرزمین آینده
import { futureScene } from "./scenes.js";
import { guide } from "./art.js";
import { h, fa, floatPoints, sleep } from "./ui.js";

const NS = "http://www.w3.org/2000/svg";

export async function runStage4(ctx) {
  const { worlds } = ctx.content.stage4;
  const L = ctx.content.limits;
  const motives = ctx.content.motives;
  const titles = Object.fromEntries(worlds.map((w) => [w.id, w.title]));
  const picks = [], times = {};
  const gems = Object.fromEntries(Object.keys(motives).map((k) => [k, 0]));

  const wrap = h("div", { class: "scene-wrap scene-wrap--future", html: futureScene(titles) });
  const svg = wrap.querySelector("svg");
  const info = h("div", { class: "infobar" }, "روی هر جزیره بزن تا درباره‌اش بخوانی. سه دنیایی را که دوست داری به ترتیب علاقه انتخاب کن (اولی بیشتر از همه).");
  const counter = h("span", { class: "pill" });
  const compassBox = h("div");
  ctx.main.append(h("div", { class: "chipbar" }, counter, h("span", { class: "hint" }, "برای برداشتن انتخاب، دوباره روی جزیره بزن")), wrap, info, compassBox);
  ctx.say("این‌جا شش دنیای کاری است. دنیاهایی را که دوست داری در آن‌ها فعالیت کنی انتخاب کن.", "wow");

  function drawRanks() {
    svg.querySelectorAll(".world").forEach((g) => {
      const idx = picks.indexOf(g.dataset.world);
      g.classList.toggle("is-picked", idx >= 0);
      const slot = g.querySelector(".world-rank");
      slot.replaceChildren();
      if (idx >= 0) {
        const n = document.createElementNS(NS, "g");
        n.setAttribute("class", "rank");
        n.innerHTML = `<circle r="24" fill="#F97316" stroke="#fff" stroke-width="4"/><text y="9" text-anchor="middle" font-size="26" font-weight="700" fill="#fff">${fa(idx + 1)}</text>`;
        slot.append(n);
      }
    });
    counter.replaceChildren("انتخاب‌شده: ", h("b", {}, `${fa(picks.length)} از ${fa(L.world_picks)}`));
    ctx.sub((picks.length / L.world_picks) * 60 + (picks.length === L.world_picks ? 20 : 0));
    drawCompass();
  }

  function showInfo(id) {
    const w = worlds.find((x) => x.id === id);
    info.replaceChildren(h("b", {}, w.title), " — ", w.blurb, h("div", { class: "hint" }, "نمونه مسیرها: " + w.samples.join("، ")));
  }

  svg.querySelectorAll(".world").forEach((g) => {
    const id = g.dataset.world;
    const toggle = () => {
      showInfo(id);
      const i = picks.indexOf(id);
      if (i >= 0) picks.splice(i, 1);
      else if (picks.length < L.world_picks) { picks.push(id); times[id] = ctx.elapsed(); ctx.hud.bump(ctx.P.world); floatPoints(counter, `+${fa(ctx.P.world)}`); }
      else { ctx.say("سه دنیا انتخاب شده. روی یکی بزن تا برداشته شود و جای آن را عوض کنی.", "think"); return; }
      if (i >= 0) ctx.hud.bump(-ctx.P.world);
      if (picks.length === L.world_picks && i < 0) ctx.say("عالی! حالا قطب‌نمای انگیزه‌ات را تنظیم کن.", "cheer");
      drawRanks();
    };
    g.addEventListener("mouseenter", () => showInfo(id));
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });

  let submitBtn = null;
  function drawCompass() {
    compassBox.replaceChildren();
    if (picks.length !== L.world_picks) return;
    const used = Object.values(gems).reduce((a, b) => a + b, 0);
    const left = L.gems - used;
    submitBtn = h("button", { class: "btn btn--primary btn--big btn--pulse", disabled: left !== 0 }, "ثبت و ساخت گزارش");
    submitBtn.onclick = submit;
    compassBox.append(h("div", { class: "compass" },
      h("h3", {}, "قطب‌نمای انگیزه 🧭"),
      h("div", { class: "hint" }, `در روز کاری رؤیایی‌ات کدام بیشتر مهم است؟ ${fa(L.gems)} جواهر را بین این سه تقسیم کن. جواهر باقی‌مانده: ${fa(left)}`),
      Object.entries(motives).map(([k, m]) => h("div", { class: "need" },
        h("div", {}, h("b", {}, m.title), h("div", { class: "gems" }, Array.from({ length: L.gems }, (_, i) => h("span", { class: `gem ${i < gems[k] ? "on" : ""}` })))),
        h("div", { class: "stepper" },
          h("button", { disabled: gems[k] <= 0, onclick: () => { gems[k]--; drawCompass(); }, "aria-label": "کم کن" }, "−"),
          h("b", {}, fa(gems[k])),
          h("button", { disabled: left <= 0, onclick: () => { gems[k]++; drawCompass(); }, "aria-label": "زیاد کن" }, "+")),
        h("small", {}, m.desc))),
      h("div", { class: "row" }, submitBtn)));
    if (left === 0) submitBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  let submitting = false;
  async function submit() {
    if (submitting) return;
    submitting = true; submitBtn.disabled = true;
    try {
      const res = await ctx.finish({ worlds: picks.map((id) => ({ id, t_ms: times[id] || 0 })), gems });
      ctx.hud.bump(0);
      ctx.main.replaceChildren(h("div", { class: "loader" }, h("div", {},
        h("div", { class: "guide-wrap", html: guide("think") }),
        h("h2", {}, "در حال ساختن گزارش تو"), h("p", { class: "hint" }, "انتخاب‌ها و عملکردت را کنار هم می‌گذارم…"),
        h("div", { class: "dots" }, h("i"), h("i"), h("i")))));
      ctx.say("یک لحظه صبر کن؛ دارم همه‌ی تکه‌ها را کنار هم می‌چینم.", "think");
      await sleep(2400);
      await ctx.summary(res, "سفرت کامل شد!", "گزارش خودشناسی تو آماده است.");
      finishResolve();
    } catch (e) { ctx.fail(e); submitting = false; submitBtn.disabled = false; }
  }
  let finishResolve;
  drawRanks();
  await new Promise((r) => (finishResolve = r));
}

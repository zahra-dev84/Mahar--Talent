// مرحله ۲ — مأموریت نجات: شهر هوشمند نورآباد
import { cityScene, setCityLight, CITY_SPOTS } from "./scenes.js";
import { icon } from "./art.js";
import { h, fa, floatPoints, confetti, sleep, now } from "./ui.js";

export async function runStage2(ctx) {
  const S = ctx.content.stage2;
  const P = ctx.P;
  let light = 12, calm = 20;
  const read = [];

  const wrap = h("div", { class: "scene-wrap scene-wrap--city", html: cityScene() });
  const svg = wrap.querySelector("svg");
  const mLight = h("b"), mCalm = h("b");
  wrap.append(h("div", { class: "meters" },
    h("div", { class: "meter meter--light" }, h("span", {}, "روشنایی شهر"), h("i", {}, mLight)),
    h("div", { class: "meter meter--calm" }, h("span", {}, "آرامش مردم"), h("i", {}, mCalm))));
  const drawMeters = () => {
    mLight.style.width = light + "%"; mCalm.style.width = calm + "%";
    setCityLight(svg, light);
    svg.querySelectorAll(".win:not(.on)").forEach((w, i) => w.classList.toggle("flick", light < 100 && i % 5 === 0));
    svg.querySelectorAll(".win.on").forEach((w) => w.classList.remove("flick"));
  };
  const area = h("div", { style: { display: "grid", gap: "14px" } });
  ctx.main.append(wrap, area);
  requestAnimationFrame(drawMeters);

  // ---- سرنخ‌ها
  const clueBtns = S.clues.map((c) => {
    const [x, y] = CITY_SPOTS[c.id];
    const b = h("button", { class: "clue", style: { left: (x / 1200) * 100 + "%", top: (y / 560) * 100 + "%" }, "aria-label": `سرنخ: ${c.title}`, title: c.title }, h("span", {}, "؟"));
    b.onclick = () => {
      const first = !read.includes(c.id);
      const m = h("div", { class: "modal", onclick: (e) => e.target === m && m.remove() },
        h("div", { class: "sheet" }, h("div", { class: "sheet__body" }, h("h3", {}, c.title), h("p", {}, c.text),
          h("button", { class: "btn btn--primary", style: { width: "100%" }, onclick: () => m.remove() }, "فهمیدم"))));
      document.body.append(m);
      if (first) { read.push(c.id); b.classList.add("is-read"); b.firstChild.textContent = "✓"; ctx.hud.bump(P.clue); floatPoints(b, `+${fa(P.clue)}`); }
    };
    wrap.append(b);
    return b;
  });
  const lockClues = () => clueBtns.forEach((b) => (b.style.pointerEvents = "none", b.style.opacity = ".5"));

  const applyFx = (fx) => { light = Math.min(100, light + (fx?.light || 0)); calm = Math.min(100, calm + (fx?.calm || 0)); drawMeters(); };

  // ---- نمایش یک تصمیم
  function decide({ title, prompt, found, options, pts, say, mood }) {
    return new Promise((resolve) => {
      const t0 = now();
      const cards = options.map((o) => {
        const c = h("button", { class: "card" }, h("div", { class: "card__ic", html: icon(o.icon) }), h("div", {}, h("b", {}, o.title), h("span", {}, o.desc)));
        c.onclick = async () => {
          cards.forEach((x) => (x.disabled = true));
          c.classList.add("is-picked");
          applyFx(o.fx);
          ctx.hud.bump(pts); floatPoints(c, `+${fa(pts)}`);
          await sleep(900);
          resolve({ option: o, t_ms: Math.round(now() - t0) });
        };
        return c;
      });
      area.replaceChildren(h("div", { class: "narr" }, found ? h("div", { class: "found" }, found) : null, h("h3", {}, title), h("div", {}, prompt)), h("div", { class: "opts" }, cards));
      ctx.say(say, mood || "think");
      area.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  ctx.say("شهر تاریک است! قبل از تصمیم‌گیری می‌توانی روی علامت‌های «؟» در شهر بزنی و سرنخ جمع کنی.", "wow");
  ctx.sub(5);

  // ---- صحنه ۱
  const d1 = await decide({ title: S.scene1.title, prompt: S.scene1.prompt, options: S.scene1.options, pts: P.decision, say: "سرنخ‌ها اختیاری‌اند. هر وقت آماده بودی، یک راه را انتخاب کن. هیچ راه غلطی وجود ندارد." });
  const cause = d1.option.cause;
  ctx.sub(30);

  // ---- صحنه ۲ (شاخه‌ای بر اساس علت)
  const branch = S.scene2.causes[cause];
  const d2 = await decide({ title: S.scene2.title, found: branch.discovery, prompt: branch.prompt, options: branch.options, pts: P.decision, say: "داستان بسته به انتخاب تو عوض شد! حالا چه می‌کنی؟" });
  ctx.sub(55);

  // ---- کوله‌ی ابزار
  const picked = [];
  const tools = await new Promise((resolve) => {
    const t0 = now();
    const N = S.tools.pick;
    const slots = h("div", { class: "slots" });
    const ok = h("button", { class: "btn btn--primary btn--big", disabled: true }, "کوله آماده است");
    const draw = () => {
      slots.replaceChildren(...Array.from({ length: N }, (_, i) => {
        const t = S.tools.options.find((x) => x.id === picked[i]);
        return h("div", { class: `slot ${t ? "is-full" : ""}`, html: t ? icon(t.icon) : "" });
      }));
      ok.disabled = picked.length !== N;
      cards.forEach((c, i) => c.classList.toggle("is-picked", picked.includes(S.tools.options[i].id)));
    };
    const cards = S.tools.options.map((t) => {
      const c = h("button", { class: "card tool" }, h("div", { class: "card__ic", html: icon(t.icon) }), h("b", {}, t.title), h("span", {}, t.desc));
      c.onclick = () => {
        const i = picked.indexOf(t.id);
        if (i >= 0) picked.splice(i, 1);
        else if (picked.length < N) picked.push(t.id);
        else { picked.shift(); picked.push(t.id); }
        draw();
      };
      return c;
    });
    ok.onclick = () => { ctx.hud.bump(P.tools); floatPoints(ok, `+${fa(P.tools)}`); resolve({ options: [...picked], t_ms: Math.round(now() - t0) }); };
    area.replaceChildren(h("div", { class: "narr" }, h("h3", {}, S.tools.title), h("div", {}, S.tools.prompt)), slots, h("div", { class: "pack" }, cards), h("div", { class: "row" }, ok));
    draw();
    ctx.say("کوله‌ات کوچک است. هر ابزاری را که حس می‌کنی بیشتر به دردت می‌خورد انتخاب کن.", "think");
  });
  ctx.sub(75);

  // ---- طرح نهایی
  const d4 = await decide({ title: S.scene4.title, prompt: S.scene4.prompt, options: S.scene4.options, pts: P.decision, say: "لحظه‌ی آخر! همه‌ی راه‌ها شهر را روشن می‌کنند؛ فقط شیوه‌شان فرق دارد.", mood: "wow" });

  // ---- پایان داستان: روشن شدن شهر
  lockClues();
  light = 100; calm = Math.max(calm, 80); drawMeters();
  confetti(innerWidth / 2, innerHeight / 3, 60);
  area.replaceChildren(h("div", { class: "ending" }, h("h3", {}, "نورآباد دوباره روشن شد! 🌟"), h("p", {}, d4.option.ending)));
  ctx.say("نگاه کن! چراغ‌های شهر روشن شدند. این پایان فقط مال شیوه‌ی توست.", "cheer");
  ctx.sub(95);
  await sleep(2600);

  const payload = {
    clues: read,
    scene1: { option: d1.option.id, t_ms: d1.t_ms },
    scene2: { option: d2.option.id, cause, t_ms: d2.t_ms },
    tools,
    scene4: { option: d4.option.id, t_ms: d4.t_ms },
  };
  const res = await ctx.finish(payload).catch((e) => { ctx.fail(e); throw e; });
  await ctx.summary(res, "مأموریت نجات موفق بود!", "شهر با شیوه‌ی خودت نجات پیدا کرد.");
}

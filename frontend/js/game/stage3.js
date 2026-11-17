// مرحله ۳ — کارگاه خلاقیت (۳ مأموریت اجباری + ۱ مأموریت اختیاری)
import { workshopBg } from "./scenes.js";
import { icon, shape, pipeTile } from "./art.js";
import { h, fa, floatPoints, confetti, sleep, draggable, now, clamp } from "./ui.js";

export async function runStage3(ctx) {
  const S = ctx.content.stage3;
  const done = { pattern: false, sort: false, design: false, circuit: false };
  ctx.root.classList.add("workshop");
  ctx.root.prepend(h("div", { class: "workshop__bg", html: workshopBg() }));

  const reward = (anchor, pts) => { if (pts > 0) { ctx.hud.bump(pts); floatPoints(anchor, `+${fa(pts)}`); } };
  const next = (label = "ادامه") => new Promise((r) => { const b = h("button", { class: "btn btn--primary btn--big", onclick: () => r() }, label); ctx.main.querySelector(".task").append(h("div", { class: "row" }, b)); b.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
  const feedback = (kind, text) => { const old = ctx.main.querySelector(".feedback"); old && old.remove(); const f = h("div", { class: `feedback feedback--${kind}` }, text); ctx.main.querySelector(".task").append(f); return f; };

  // ================================================================ الگوی گمشده
  async function patternTask() {
    for (const p of S.patterns) {
      await new Promise((resolve) => {
        let t0 = now(), busy = false;
        const q = h("div", { class: "cell cell--q" }, "؟");
        const btns = p.options.map((o) => h("button", { class: "choice", "data-id": o.id, html: shape(o.spec), "aria-label": `گزینه ${o.id}` }));
        const task = h("div", { class: "task" },
          h("div", { class: "task__top" }, h("h3", {}, `الگوی گمشده — ${p.title}`), h("span", { class: "pill" }, "حداکثر ۲ تلاش")),
          h("div", {}, p.prompt),
          h("div", { class: "seq" }, p.sequence.map((s) => h("div", { class: "cell", html: shape(s) })), q),
          h("div", { class: "choices" }, btns));
        ctx.mount(task);
        ctx.say("به شکل، رنگ و اندازه نگاه کن. اگر اشتباه کنی یک راهنمایی می‌گیری.", "think");
        btns.forEach((b) => (b.onclick = async () => {
          if (busy) return; busy = true; btns.forEach((x) => (x.disabled = true));
          try {
            const res = await ctx.api.attempt({ task: p.id, option: b.dataset.id, duration_ms: Math.round(now() - t0) });
            reward(b, res.points);
            if (res.correct) {
              b.classList.add("is-ok"); q.innerHTML = shape(p.options.find((o) => o.id === b.dataset.id).spec); q.classList.add("is-filled");
              confetti(b.getBoundingClientRect().left, b.getBoundingClientRect().top, 24);
              feedback("ok", res.attempt_no === 1 ? "آفرین! همان اول پیدا کردی. 🎯" : "عالی! با راهنمایی درستش را پیدا کردی. 👏");
              ctx.say(res.attempt_no === 1 ? "چه چشم تیزی!" : "یادگیری از راهنمایی یعنی همین!", "cheer");
              await next(); resolve();
            } else {
              b.classList.add("is-no");
              if (res.final) {
                btns.find((x) => x.dataset.id === res.reveal)?.classList.add("is-ok");
                feedback("no", "این بار نشد، اما نگران نباش. گزینه‌ی سبز درست بود؛ دقت کن که هر ویژگی دوره‌ی خودش را دارد.");
                await next(); resolve();
              } else {
                feedback("info", "هنوز نه! راهنمایی: " + res.hint);
                ctx.say("یک بار دیگر امتحان کن!", "think");
                btns.forEach((x) => (x.disabled = x.classList.contains("is-no"))); busy = false; t0 = now();
              }
            }
          } catch (e) { ctx.fail(e); btns.forEach((x) => (x.disabled = x.classList.contains("is-no"))); busy = false; }
        }));
      });
    }
    done.pattern = true;
  }

  // ================================================================ سازمان‌دهی انبار
  async function sortTask() {
    const { items, bins } = S.sort;
    const place = Object.fromEntries(items.map((i) => [i.id, null]));
    let selected = null, attempt = 0, locked = false, t0 = now();
    const marks = {};
    const check = h("button", { class: "btn btn--primary btn--big", disabled: true }, "بررسی کن");
    const root = h("div", { class: "task" });
    const render = () => {
      const mk = (it) => {
        const el = h("div", { class: `titem ${selected === it.id ? "is-selected" : ""} ${marks[it.id] === true ? "is-ok" : marks[it.id] === false ? "is-no" : ""}`, role: "button", tabindex: 0, html: icon(it.icon) + `<div>${it.title}</div>` });
        if (!locked) {
          draggable(el, { target: ".bin, .pile", onDrop: (t) => { if (t) { move(it.id, t.dataset.bin || null); } }, onClick: () => {
            // اگر ابزار دیگری انتخاب شده، زدن روی این ابزار یعنی «همان‌جا بگذارش»
            if (selected && selected !== it.id) { const target = place[it.id]; setTimeout(() => move(selected, target), 0); return; }
            selected = selected === it.id ? null : it.id; setTimeout(render, 0);
          } });
        }
        return el;
      };
      const bindZone = (el, binId) => { el.dataset.bin = binId || ""; if (!locked) el.addEventListener("click", (e) => { if (selected && e.target.closest(".titem") === null) move(selected, binId); }); };
      const pile = h("div", { class: "pile" }, items.filter((i) => !place[i.id]).map(mk));
      bindZone(pile, null);
      const binEls = bins.map((b) => {
        const body = h("div", { class: "bin__items" }, items.filter((i) => place[i.id] === b.id).map(mk));
        const el = h("div", { class: "bin" }, h("div", { class: "bin__head" }, h("span", { html: icon(b.icon) }), b.title), body);
        bindZone(el, b.id);
        return el;
      });
      check.disabled = locked || Object.values(place).some((v) => !v);
      check.textContent = attempt ? "بررسی دوباره" : "بررسی کن";
      const fb = root.querySelector(".feedback");
      root.replaceChildren(h("div", { class: "task__top" }, h("h3", {}, "سازمان‌دهی انبار"), h("span", { class: "pill" }, "حداکثر ۲ تلاش")),
        h("div", {}, "هر ابزار را بکش و در قفسه‌ی مناسبش بینداز (یا ابزار را بزن و بعد قفسه را بزن)."),
        h("div", { class: "sorter" }, pile, h("div", { class: "bins" }, binEls)), h("div", { class: "row" }, check), fb || "");
    };
    const move = (id, binId) => { if (locked) return; place[id] = binId || null; delete marks[id]; selected = null; render(); };
    ctx.mount(root); render();
    ctx.say("اینجا انبار مهندس‌هاست و همه‌چیز به‌هم ریخته. نظمش با تو!", "happy");
    await new Promise((resolve) => {
      check.onclick = async () => {
        check.disabled = true;
        try {
          attempt++;
          const res = await ctx.api.attempt({ task: "sort", placement: place, duration_ms: Math.round(now() - t0) });
          Object.assign(marks, res.per_item); reward(check, res.points);
          if (res.final) {
            locked = true;
            if (res.correct) { confetti(); }
            else { await sleep(900); for (const [id, b] of Object.entries(res.correct_bins)) { place[id] = b; } Object.keys(marks).forEach((k) => (marks[k] = true)); }
            render();
            feedback(res.correct ? "ok" : "info", res.correct ? (attempt === 1 ? "بی‌نقص بود! همه‌چیز سر جای خودش است. ✨" : "آفرین! با بازخورد، انبار را کامل مرتب کردی.") : `${fa(res.correct_count)} از ${fa(res.total)} ابزار درست بود. من بقیه را سر جایشان گذاشتم؛ ببین چطور دسته‌بندی شده‌اند.`);
            ctx.say(res.correct ? "نظم و دقتت عالی بود!" : "با تمرین بهتر می‌شود.", res.correct ? "cheer" : "happy");
            await next(); resolve();
          } else {
            render();
            feedback("info", `${fa(res.correct_count)} از ${fa(res.total)} ابزار درست است. موردهای قرمز را جابه‌جا کن و دوباره بررسی کن.`);
            ctx.say("قرمزها جای دیگری می‌روند. یک شانس دیگر داری!", "think"); t0 = now();
          }
        } catch (e) { attempt--; ctx.fail(e); render(); }
      };
    });
    done.sort = true;
  }

  // ================================================================ طراحی غرفه
  async function designTask() {
    const D = S.design;
    const itemMap = Object.fromEntries(D.items.map((i) => [i.id, i]));
    let theme = D.themes[0], placed = [], title = "", selected = null, attempt = 0, uid = 0, t0 = now();
    const canvas = h("div", { class: "canvas" });
    const submit = h("button", { class: "btn btn--primary btn--big", disabled: true }, "ثبت غرفه");
    const titleIn = h("input", { class: "field", maxlength: 40, placeholder: "برای غرفه‌ات اسمی انتخاب کن (مثلاً «دنیای فردا»)", oninput: (e) => (title = e.target.value) });
    const root = h("div", { class: "task" });
    const toCanvas = (ev) => { const r = canvas.getBoundingClientRect(); return { x: clamp(((ev.clientX - r.left) / r.width) * D.canvas.w, 20, D.canvas.w - 20), y: clamp(((ev.clientY - r.top) / r.height) * D.canvas.h, 20, D.canvas.h - 20) }; };
    const drawCanvas = () => {
      canvas.style.setProperty("--c1", theme.bg[0]); canvas.style.setProperty("--c2", theme.bg[1]);
      canvas.replaceChildren(!placed.length ? h("div", { class: "canvas__hint" }, "آیتم‌ها را از پایین بکش و اینجا بینداز") : "");
      placed.forEach((p) => {
        const el = h("div", { class: `placed ${selected === p.uid ? "is-selected" : ""}`, style: { left: (p.x / D.canvas.w) * 100 + "%", top: (p.y / D.canvas.h) * 100 + "%" }, html: icon(itemMap[p.item].icon), title: itemMap[p.item].title });
        draggable(el, { target: ".canvas", onDrop: (t, ev) => { if (t) Object.assign(p, toCanvas(ev)); drawCanvas(); }, onClick: () => { selected = selected === p.uid ? null : p.uid; drawCanvas(); drawBar(); } });
        canvas.append(el);
      });
      submit.disabled = placed.length < D.min_items;
    };
    const bar = h("div", { class: "row" });
    const drawBar = () => bar.replaceChildren(
      h("button", { class: "btn btn--ghost", disabled: !selected, onclick: () => { placed = placed.filter((p) => p.uid !== selected); selected = null; drawCanvas(); drawBar(); } }, "حذف آیتم انتخاب‌شده"),
      h("span", { class: "pill" }, "آیتم‌ها: ", h("b", {}, fa(placed.length))));
    const themes = h("div", { class: "themes" });
    const drawThemes = () => themes.replaceChildren(h("span", { class: "hint" }, "تم غرفه:"), ...D.themes.map((t) => h("button", { class: `chip ${t.id === theme.id ? "is-on" : ""}`, onclick: () => { theme = t; drawThemes(); drawCanvas(); } }, t.title)));
    const palette = h("div", { class: "palette" }, D.items.map((it) => {
      const el = h("div", { class: "pal", html: icon(it.icon) + `<div>${it.title}</div>`, role: "button", tabindex: 0 });
      const add = (pt) => { if (placed.length >= D.max_items) return; placed.push({ uid: ++uid, item: it.id, ...(pt || { x: 100 + Math.random() * 400, y: 80 + Math.random() * 200 }) }); drawCanvas(); drawBar(); };
      draggable(el, { target: ".canvas", onDrop: (t, ev) => t && add(toCanvas(ev)), onClick: () => add() });
      return el;
    }));
    root.append(h("div", { class: "task__top" }, h("h3", {}, "طراحی غرفه‌ی نمایشگاه"), h("span", { class: "pill" }, `حداقل ${fa(D.min_items)} آیتم`)),
      h("div", {}, "یک غرفه‌ی نمایشگاهی بساز. هر چیزی که دوست داری بچین؛ جواب درست و غلط ندارد."), themes,
      h("div", { class: "design" }, canvas, palette, titleIn, bar), h("div", { class: "row" }, submit));
    ctx.mount(root); drawThemes(); drawCanvas(); drawBar();
    ctx.say("اینجا خلاقیتت را نشان بده! آیتم را بکش یا فقط بزن تا اضافه شود.", "happy");

    await new Promise((resolve) => {
      submit.onclick = async () => {
        submit.disabled = true;
        try {
          attempt++;
          const res = await ctx.api.attempt({ task: "design", theme: theme.id, title, duration_ms: Math.round(now() - t0), placed: placed.map((p) => ({ item: p.item, x: Math.round(p.x), y: Math.round(p.y) })) });
          reward(submit, res.points);
          if (res.can_revise) {
            ctx.say("غرفه‌ات ثبت شد. یک پیشنهاد دارم!", "wow");
            const f = feedback("info", res.suggestion.text);
            const row = h("div", { class: "row" },
              h("button", { class: "btn btn--primary", onclick: () => { f.remove(); row.remove(); submit.disabled = false; submit.textContent = "ثبت نسخه‌ی بازطراحی‌شده"; t0 = now(); ctx.say("بازطراحی کن و دوباره ثبت کن.", "happy"); } }, "بازطراحی می‌کنم"),
              h("button", { class: "btn btn--ghost", onclick: async () => { row.remove(); try { await ctx.api.choice({ key: "design_revise", item: "design", value: "declined", t_ms: ctx.elapsed() }); } catch (e) { ctx.fail(e); } confetti(); await next(); resolve(); } }, "همین خوب است"));
            root.append(row);
          } else {
            confetti();
            feedback("ok", attempt > 1 ? "عالی! با بازخورد غرفه‌ات را بهتر کردی. 🎨" : "غرفه‌ی فوق‌العاده‌ای ساختی! 🎨");
            ctx.say("چه ایده‌هایی!", "cheer");
            await next(); resolve();
          }
        } catch (e) { attempt--; ctx.fail(e); submit.disabled = false; }
      };
    });
    done.design = true;
  }

  // ================================================================ تعمیر مدار (اختیاری)
  async function circuitTask() {
    const C = S.circuit;
    const rots = C.tiles.map((t) => t.rot);
    let attempts = 0, lit = new Set(), busy = false, t0 = now();
    const board = h("div", { class: "board" });
    const power = h("button", { class: "btn btn--primary btn--big" }, "برق را وصل کن ⚡");
    const quit = h("button", { class: "btn btn--ghost" }, "بی‌خیال می‌شوم");
    const draw = () => {
      const cells = [h("div", { class: "end", html: icon("battery"), title: "باتری" })];
      for (let r = 0; r < C.rows; r++) {
        if (r > 0) cells.push(h("div"));
        for (let c = 0; c < C.cols; c++) {
          const i = r * C.cols + c;
          const t = h("button", { class: `tile ${lit.has(i) ? "is-lit" : ""}`, html: pipeTile(C.tiles[i].type), "aria-label": `لوله ${fa(i + 1)}` });
          t.firstChild.style.transform = `rotate(${rots[i] * 90}deg)`;
          t.onclick = () => { if (busy) return; rots[i] = (rots[i] + 1) % 4; t.firstChild.style.transform = `rotate(${rots[i] * 90}deg)`; };
          cells.push(t);
        }
        cells.push(r === C.rows - 1 ? h("div", { class: `end ${lit.has(C.rows * C.cols - 1) ? "lit" : ""}`, html: icon("lamp_on"), title: "لامپ" }) : h("div"));
      }
      board.replaceChildren(...cells);
    };
    const root = h("div", { class: "task" }, h("div", { class: "task__top" }, h("h3", {}, "تعمیر مدار برق (اختیاری)"), h("span", { class: "pill" }, "هر لوله را بزن تا بچرخد")),
      h("div", {}, "لوله‌ها را طوری بچرخان که برق از باتری (بالا-چپ) به لامپ (پایین-راست) برسد."), board, h("div", { class: "row" }, power, quit));
    ctx.mount(root); draw();
    ctx.say("مدار این کارگاه خراب شده. لوله‌ها را بچرخان تا لامپ روشن شود!", "think");
    await new Promise((resolve) => {
      quit.onclick = () => resolve();
      power.onclick = async () => {
        busy = true; power.disabled = true;
        try {
          attempts++;
          const res = await ctx.api.attempt({ task: "circuit", rotations: rots, duration_ms: Math.round(now() - t0) });
          lit = new Set(res.powered); reward(power, res.points); draw();
          if (res.correct) {
            confetti(); feedback("ok", attempts === 1 ? "همان اول لامپ روشن شد! ⚡" : "لامپ روشن شد! مهندس‌ها خوشحال‌اند. 💡"); ctx.say("برق‌رسان ماهری هستی!", "cheer");
            quit.remove(); power.remove(); await next(); resolve();
          } else {
            feedback("no", "لامپ هنوز روشن نشد. بخش زردشده نشان می‌دهد برق تا کجا رسیده است." + (res.hint ? " " + res.hint : ""));
            busy = false; power.disabled = false; t0 = now();
          }
        } catch (e) { attempts--; ctx.fail(e); busy = false; power.disabled = false; }
      };
    });
    done.circuit = true;
  }

  // ================================================================ میز کار (مرکز مأموریت‌ها)
  const STATIONS = [
    { id: "pattern", icon: "st_pattern", title: "الگوی گمشده", sub: "دو معمای شکل", run: patternTask },
    { id: "sort", icon: "st_sort", title: "سازمان‌دهی انبار", sub: "ابزارها را دسته‌بندی کن", run: sortTask },
    { id: "design", icon: "st_design", title: "طراحی غرفه", sub: "خلاقیتت را نشان بده", run: designTask },
    { id: "circuit", icon: "st_circuit", title: "تعمیر مدار", sub: "مأموریت اختیاری", run: circuitTask, bonus: true },
  ];
  let bonusAnswered = false;

  async function offerBonus() {
    await new Promise((resolve) => {
      ctx.mount(h("div", { class: "task bonus-offer" }, h("h3", {}, "یک مأموریت اختیاری ⚡"),
        h("div", { style: { width: "90px", height: "90px", margin: "0 auto" }, html: icon("st_circuit") }),
        h("p", {}, "مهندس‌ها یک مدار خراب دارند. اگر دوست داری می‌توانی تعمیرش کنی؛ اگر نه، مشکلی نیست."),
        h("div", { class: "row" },
          h("button", { class: "btn btn--primary", onclick: async () => { try { await ctx.api.choice({ key: "bonus_circuit", item: "circuit", value: "accepted", t_ms: ctx.elapsed() }); } catch (e) { ctx.fail(e); } bonusAnswered = "accepted"; resolve(); } }, "قبول می‌کنم"),
          h("button", { class: "btn btn--ghost", onclick: async () => { try { await ctx.api.choice({ key: "bonus_circuit", item: "circuit", value: "skipped", t_ms: ctx.elapsed() }); } catch (e) { ctx.fail(e); } bonusAnswered = "skipped"; done.circuit = true; resolve(); } }, "این بار نه"))));
      ctx.say("این مأموریت اجباری نیست؛ انتخابش با خودت است.", "happy");
    });
    if (bonusAnswered === "accepted") await circuitTask();
  }

  while (true) {
    const must = ["pattern", "sort", "design"];
    const allDone = must.every((k) => done[k]);
    const finish = h("button", { class: "btn btn--primary btn--big btn--pulse", disabled: !allDone }, "پایان کارگاه");
    const chosen = await new Promise((resolve) => {
      ctx.sub((must.filter((k) => done[k]).length / 3) * 90);
      ctx.mount(h("div", { style: { display: "grid", gap: "14px" } },
        h("div", { class: "task__top" }, h("h3", {}, "میز کار مهندس‌ها"), h("span", { class: "pill" }, "انجام‌شده: ", h("b", {}, `${fa(must.filter((k) => done[k]).length)} از ${fa(3)}`))),
        h("div", { class: "stations" }, STATIONS.map((s) => {
          const isDone = done[s.id];
          const el = h("button", { class: `station ${isDone ? "is-done" : ""} ${s.bonus ? "station--bonus" : ""}`, disabled: isDone, onclick: () => resolve(s) },
            h("div", { class: "station__ic", html: icon(s.icon) }), h("b", {}, s.title), h("small", {}, isDone ? (s.bonus && bonusAnswered === "skipped" ? "رد شد" : "انجام شد") : s.sub));
          return el;
        })),
        h("div", { class: "row" }, finish)));
      ctx.say(allDone ? "همه‌ی مأموریت‌های اصلی تمام شد! اگر می‌خواهی مأموریت اختیاری را هم امتحان کن، وگرنه کارگاه را تمام کن." : "ایستگاه‌ها را به هر ترتیبی که دوست داری انجام بده. ترتیب انتخابت هم برایم جالب است!", "happy");
      finish.onclick = () => resolve(null);
    });
    if (chosen === null) break;
    try { await ctx.api.choice({ key: "station_open", item: chosen.id, t_ms: ctx.elapsed() }); } catch (e) { ctx.fail(e); }
    if (chosen.bonus) await offerBonus(); else await chosen.run();
  }

  const res = await ctx.finish({}).catch((e) => { ctx.fail(e); throw e; });
  await ctx.summary(res, "کارگاه را تمام کردی!", "مأموریت‌ها را انجام دادی و از بازخوردها استفاده کردی.");
}

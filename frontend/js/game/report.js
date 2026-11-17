// گزارش نهایی خودشناسی
import { guide, badgeArt } from "./art.js";
import { h, fa, confetti } from "./ui.js";
import  jobData  from "../jobsData.js";

const LETTERS = ["R", "I", "A", "S", "E", "C"];
const LCOLOR = { R: "#F97316", I: "#22D3EE", A: "#F472B6", S: "#34D399", E: "#FACC15", C: "#A78BFA" };
const LSHORT = { R: "عملی", I: "پژوهشی", A: "هنری", S: "اجتماعی", E: "کارآفرین", C: "سازمانی" };
const FAMILY = { tech: "فناوری", design: "طراحی", craft: "فنی و ساخت", people: "انسانی", business: "کسب‌وکار", office: "اداری و مالی" };
const STATION = { pattern: "الگوی گمشده", sort: "سازمان‌دهی انبار", design: "طراحی غرفه", circuit: "تعمیر مدار" };

function radar(index) {
  const R = 100, cx = 150, cy = 150;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i * Math.PI) / 3; return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)]; };
  const ring = (v) => LETTERS.map((_, i) => pt(i, v).join(",")).join(" ");
  const poly = LETTERS.map((l, i) => pt(i, (index[l] || 0) / 100).join(",")).join(" ");
  const labels = LETTERS.map((l, i) => { const [x, y] = pt(i, 1.28); return `<text x="${x}" y="${y + 4}" text-anchor="middle" font-weight="700" fill="${LCOLOR[l]}">${l} · ${LSHORT[l]}</text>`; }).join("");
  return `<svg class="radar" viewBox="0 0 300 300" role="img" aria-label="نمودار علایق">
    ${[0.25, 0.5, 0.75, 1].map((v) => `<polygon points="${ring(v)}" fill="none" stroke="#2c3763" stroke-width="1.5"/>`).join("")}
    ${LETTERS.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}" stroke="#2c3763"/>`).join("")}
    <polygon points="${poly}" fill="rgba(249,115,22,.35)" stroke="#F97316" stroke-width="3" stroke-linejoin="round"/>
    ${LETTERS.map((l, i) => { const [x, y] = pt(i, (index[l] || 0) / 100); return `<circle cx="${x}" cy="${y}" r="5" fill="${LCOLOR[l]}" stroke="#fff" stroke-width="2"/>`; }).join("")}${labels}</svg>`;
}

const bars = (rows) => h("div", {}, rows.map((r) => h("div", { class: "bar", style: { "--c": r.color || "#F97316" } },
  h("span", {}, r.label), h("i", {}, h("b", { "data-w": r.value })), h("em", {}, r.text ?? fa(Math.round(r.value))))));


function renderVideos(jobRef) {
  const videos = jobData[jobRef]?.videos || [];

  if (!videos.length) {
    return h("p", { class: "hint" }, "فعلاً ویدئویی برای این مسیر ثبت نشده است.");
  }

  return h(
    "div",
    { class: "video-list" },
    videos
      .filter((video) => video.embed)
      .map((video) =>
        h(
          "div",
          { class: "video-card" },
          h("h4", {}, video.title),
          h("iframe", {
            src: video.embed,
            title: video.title,
            loading: "lazy",
            allowfullscreen: true,
            allow: "autoplay; fullscreen; picture-in-picture"
          })
        )
      )
  );
}


export function renderReport(r, opts = {}) {
  const content = opts.content;
  const interest = r.interest, ap = r.approach, perf = r.performance, mot = r.motives, pref = r.activity_preferences;
  const RFA = content?.riasec_fa || {};
  const code = r.headline.holland_code;

  const sec = (n, title, lead, ...kids) => h("section", { class: "sec" }, h("h2", {}, h("i", {}, fa(n)), title), lead ? h("p", { class: "sec__lead" }, lead) : null, ...kids);

  // ---- علایق
  const interestSec = sec(1, "پروفایل علایق", "بر اساس انتخاب‌هایت در جزیره و سرزمین آینده. نمودار «نسبی» است: بلندترین بُعد = ۱۰۰ و نشان می‌دهد علاقه‌ات بیشتر به کدام سمت می‌کشد، نه این‌که توانایی‌ات چقدر است.",
    h("div", { class: "two" }, h("div", { html: radar(interest.index) }),
      h("div", {}, bars(interest.order.map((l) => ({ label: `${l} · ${RFA[l] || LSHORT[l]}`, value: interest.index[l], color: LCOLOR[l] }))),
        h("p", { class: "hint" }, `همسویی انتخاب‌های مرحله‌ی ۱ و ۴: ${interest.consistency_label}.`))));

  // ---- نقاط قوت
  const strengthSec = sec(2, "نقاط قوت احتمالی", "این‌ها شواهدی از رفتار تو در همین بازی‌اند؛ برداشت قطعی نیستند.",
    r.strengths.length ? h("div", { class: "list" }, r.strengths.map((s) => h("div", { class: "item" }, h("b", {}, s.title), s.text, h("small", {}, "شاهد: " + s.evidence))))
      : h("p", { class: "hint" }, "در این بازی شاهد قوی‌ای برای نقطه‌ی قوت خاصی ثبت نشد؛ با تجربه‌ی بیشتر تصویر روشن‌تر می‌شود."));

  // ---- عملکرد
  const missionCards = perf.missions.map((m) => h("div", { class: "mcard" }, h("h3", {}, m.title, h("span", { class: "band" }, m.band)),
    h("dl", {}, m.metrics.map((x) => h("div", {}, h("dt", {}, x.label), h("dd", { style: { margin: 0 } }, x.value))))));
  const L = perf.learning;
  missionCards.push(h("div", { class: "mcard" }, h("h3", {}, "یادگیری از بازخورد", h("span", { class: `band ${L.score == null ? "band--na" : ""}` }, L.score == null ? "نیاز نشد" : L.band)),
    h("dl", {}, h("div", {}, h("dt", {}, "فرصت‌های اصلاح"), h("dd", { style: { margin: 0 } }, fa(L.opportunities))), h("div", {}, h("dt", {}, "بهبود پس از بازخورد"), h("dd", { style: { margin: 0 } }, fa(L.improved))))));
  const verdictText = { aligned: "علاقه و عملکرد هم‌راستا بودند", interest_gt_perf: "علاقه بیشتر از عملکرد این بازی بود", perf_gt_interest: "عملکرد بیشتر از علاقه بود", neutral: "نتیجه‌ی خاصی دیده نشد", unmeasured: "عملکرد سنجیده نشد" };
  const perfSec = sec(3, "عملکرد در مأموریت‌ها", "این بخش جدا از علاقه است: علاقه به یک فعالیت با خوب انجام دادنش یکی نیست.",
    h("div", { class: "mgrid" }, missionCards),
    h("h3", { style: { margin: "18px 0 8px", fontSize: "1.1rem" } }, "علاقه در برابر عملکرد"),
    h("div", { class: "xcheck" }, perf.cross_check.map((c) => h("div", { class: "xc" }, h("b", {}, `${c.letter} · ${RFA[c.letter] || LSHORT[c.letter]}`), h("div", {}, `علاقه: ${fa(c.interest)} · عملکرد: ${c.performance == null ? "—" : fa(Math.round(c.performance))}`), h("div", { class: "hint" }, verdictText[c.verdict])))),
    h("p", { class: "hint" }, perf.unmeasured_note));

  // ---- ترجیحات
  const motTitles = content?.motives || {};
  const approaches = content?.approaches || {};
  const clueText = ap.clues_viewed === 3 ? "هر سه سرنخ را بررسی کردی" : ap.clues_viewed === 0 ? "بدون بررسی سرنخ تصمیم گرفتی" : `${fa(ap.clues_viewed)} سرنخ از ${fa(3)} را بررسی کردی`;
  const prefSec = sec(4, "ترجیحات فعالیتی", "چه شیوه‌ای را برای حل مسئله انتخاب کردی و چه چیزی تو را انگیزه می‌دهد.",
    h("div", { class: "two" },
      h("div", {}, h("h3", { style: { fontSize: "1.1rem", marginBottom: "6px" } }, "شیوه‌ی حل مسئله در مأموریت نجات"),
        bars(Object.entries(ap.index).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: approaches[k]?.title || k, value: v, color: "#22D3EE" })))),
      h("div", {}, h("h3", { style: { fontSize: "1.1rem", marginBottom: "6px" } }, "قطب‌نمای انگیزه"),
        bars(Object.entries(mot.shares).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: motTitles[k]?.title || k, value: v * 100, color: "#34D399", text: fa(Math.round(v * 100)) + "٪" }))))),
    h("div", { class: "tags" },
      h("span", { class: "tag" }, `ریسک‌پذیری در تصمیم‌ها: ${ap.risk.label}`), h("span", { class: "tag" }, clueText),
      h("span", { class: "tag" }, `تنوع رویکرد: ${fa(ap.variety)} از ۵`),
      pref.chose_bonus ? h("span", { class: "tag" }, "مأموریت اختیاری را آزادانه پذیرفتی") : h("span", { class: "tag" }, "مأموریت اختیاری را انتخاب نکردی"),
      pref.first_station ? h("span", { class: "tag" }, `اولین ایستگاه کارگاه: ${STATION[pref.first_station] || pref.first_station}`) : null),
    pref.starred_zones.length ? h("p", {}, h("b", {}, "ستاره‌هایت: "), pref.starred_zones.join("، ")) : null,
    pref.worlds.length ? h("p", {}, h("b", {}, "دنیاهای انتخابی آینده: "), pref.worlds.map((w, i) => `${fa(i + 1)}. ${w}`).join("  ·  ")) : null);

  // ---- نیازمند تجربه بیشتر
  const needSec = sec(5, "زمینه‌های نیازمند تجربه‌ی بیشتر", "جاهایی که برای شناخت دقیق‌تر باید در دنیای واقعی امتحان کنی.",
    r.needs_experience.length ? h("div", { class: "list" }, r.needs_experience.map((n) => h("div", { class: "item item--need" }, h("b", {}, n.title), n.text)))
      : h("p", { class: "hint" }, "مورد خاصی ثبت نشد. ولی هر مسیری را با یک پروژه‌ی کوچک امتحان کن."));

  // ---- مسیرها
  const pathSec = sec(6, "سه مسیر مهارتی پیشنهادی", "درصد، «تناسب نسبی» با ترکیب علایق، رویکرد و عملکرد توست، نه احتمال موفقیت. هر مسیر را با پروژه‌ی کوچکش امتحان کن.",
    h("div", { class: "paths" }, r.recommendations.map((p) => h("article", { class: `path path--${p.rank}` },
      h("div", { class: "path__rank" }, fa(p.rank)),
      h("div", { class: "path__head" }, h("div", {}, h("h3", {}, p.title), h("div", { class: "hint" }, `${FAMILY[p.family] || ""} · ${p.summary}`)),
        h("div", { class: "path__match" }, h("b", {}, fa(p.match) + "٪"), h("small", {}, "تناسب نسبی"))),
      h("h4", { style: { margin: "14px 0 0" } }, "چرا این مسیر؟"),
      h("ul", {}, p.reasons.map((x) => h("li", {}, x))),
      p.cautions.length ? h("ul", { class: "caut" }, p.cautions.map((x) => h("li", {}, x))) : null,
      h("div", { class: "proj" }, h("h4", {}, "پروژه‌ی کوچک برای شروع: " + p.project.title), h("div", {}, p.project.goal),
        h("ol", {}, p.project.steps.map((s) => h("li", {}, s))),
        h("div", { class: "meta" }, h("span", {}, "⏱ " + p.project.hours),h(
  "div",
  { class: "videos" },
  h("h4", {}, "ویدئوهای آموزشی این مسیر"),
  renderVideos(p.job_ref)
), h("span", {}, "🎯 خروجی: " + p.project.output)))))));

  // ---- امتیاز بازی
  const earned = new Set(r.game.badges.map((b) => b.key));
  const all = content?.badges || r.game.badges;
  const gameSec = sec(7, "امتیاز و نشان‌های بازی", "این بخش فقط پاداش بازی است و در محاسبه‌ی علایق، عملکرد و مسیرها هیچ نقشی نداشته است.",
    h("div", { class: "gamebox" }, h("div", {}, h("div", { class: "score" }, fa(r.game.score)), h("div", { class: "hint" }, "امتیاز کل بازی")),
      h("div", { class: "badges-row" }, all.map((b) => h("div", { class: "nb", title: b.desc }, h("div", { html: badgeArt(b, !earned.has(b.key)) }), h("span", {}, b.title))))));

  const actions = h("div", { class: "actions" },
    h("button", { class: "btn btn--primary", onclick: () => window.print() }, "ذخیره / چاپ گزارش"),
    h("button", { class: "btn btn--ghost", onclick: () => opts.hudScoreBack && opts.hudScoreBack() }, "بازی دوباره"),
    h("a", { class: "btn btn--ghost", href: "index.html", style: { textDecoration: "none" } }, "بازگشت به مهار"));

  const node = h("main", { class: "screen" },
    h("header", { class: "hud" }, h("a", { class: "hud__home", href: "index.html", style: { textDecoration: "none" } }, "Mahar"), h("div", { class: "hud__steps" }, h("b", {}, "گزارش خودشناسی"))),
    h("div", { class: "report" },
      h("section", { class: "rhero" }, h("div", { class: "rhero__av", html: guide("cheer") }),
        h("div", {}, h("h1", {}, "گزارش خودشناسی تو آماده است!"),
          h("div", { class: "hint" }, "کد علایق تقریبی تو:"), h("div", { class: "code" }, [...code].map((c) => h("b", { title: RFA[c] }, c))),
          h("p", { class: "hint", style: { margin: "8px 0 0" } }, r.headline.top_letters.map((t) => t.title).join(" · ")))),
      interestSec, strengthSec, perfSec, prefSec, needSec, pathSec, gameSec,
      h("div", { class: "disc" }, h("b", {}, "یادآوری مهم: "), r.disclaimer), actions));
  requestAnimationFrame(() => requestAnimationFrame(() => node.querySelectorAll(".bar b[data-w]").forEach((b) => (b.style.width = b.dataset.w + "%"))));
  if (opts.fresh) setTimeout(() => confetti(innerWidth / 2, 160, 50), 700);
  return node;
}

// تصویرسازی اختصاصی بازی (SVG). همه‌ی گرافیک‌ها در همین پروژه طراحی شده‌اند.

export const DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDBA74"/><stop offset="1" stop-color="#F97316"/></linearGradient>
  <linearGradient id="gSkyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset=".65" stop-color="#BAE6FD"/><stop offset="1" stop-color="#FEF3C7"/></linearGradient>
  <linearGradient id="gSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0EA5E9"/><stop offset="1" stop-color="#075985"/></linearGradient>
  <linearGradient id="gGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="#22C55E"/></linearGradient>
  <linearGradient id="gSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>
  <linearGradient id="gDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1020"/><stop offset=".55" stop-color="#2E1065"/><stop offset="1" stop-color="#9A3412"/></linearGradient>
  <linearGradient id="gDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E3A8A"/><stop offset=".5" stop-color="#F472B6"/><stop offset="1" stop-color="#FDBA74"/></linearGradient>
  <linearGradient id="gFuture" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1020"/><stop offset=".5" stop-color="#312E81"/><stop offset="1" stop-color="#C2410C"/></linearGradient>
  <linearGradient id="gRock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8A29E"/><stop offset="1" stop-color="#57534E"/></linearGradient>
  <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0F2FE"/><stop offset="1" stop-color="#38BDF8"/></linearGradient>
  <linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C2D12"/><stop offset="1" stop-color="#431407"/></linearGradient>
  <linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78350F"/><stop offset="1" stop-color="#451A03"/></linearGradient>
  <radialGradient id="gSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF7AE"/><stop offset=".6" stop-color="#FDE047"/><stop offset="1" stop-color="#FDE047" stop-opacity="0"/></radialGradient>
  <radialGradient id="gMoon" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#FFF7ED"/><stop offset="1" stop-color="#FDBA74"/></radialGradient>
  <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs></svg>`;

const svg = (inner, vb = "0 0 64 64", cls = "") =>
  `<svg class="ico ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

// ---------------------------------------------------------------- راهنما: «مهاری»
export function guide(mood = "happy") {
  const mouth = {
    happy: `<path d="M50 70 Q60 80 70 70" stroke="#22D3EE" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    wow: `<ellipse cx="60" cy="72" rx="6" ry="7" fill="#22D3EE"/>`,
    think: `<path d="M52 72 H68" stroke="#22D3EE" stroke-width="4" stroke-linecap="round"/>`,
    cheer: `<path d="M48 68 Q60 86 72 68 Z" fill="#22D3EE"/>`,
  }[mood] || "";
  const arms = mood === "cheer"
    ? `<path d="M36 104 Q16 96 14 74" stroke="#F97316" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M84 104 Q104 96 106 74" stroke="#F97316" stroke-width="9" fill="none" stroke-linecap="round"/>`
    : `<path d="M36 106 Q18 112 18 128" stroke="#F97316" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M84 106 Q102 112 102 128" stroke="#F97316" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  const sparks = mood === "cheer"
    ? `<g fill="#FDE047"><path class="spark" d="M12 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path class="spark s2" d="M104 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g>` : "";
  const eyeY = mood === "think" ? 54 : 58;
  return `<svg class="guide guide--${mood}" viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="مهاری، راهنمای بازی">
  <g class="guide-float">
    <ellipse cx="60" cy="146" rx="30" ry="4" fill="#000" opacity=".2"/>
    <line x1="60" y1="26" x2="60" y2="10" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
    <circle class="g-bulb" cx="60" cy="8" r="6" fill="#FDE047" filter="url(#fGlow)"/>
    <path d="M24 46 L20 14 L50 32 Z" fill="#F97316"/><path d="M96 46 L100 14 L70 32 Z" fill="#F97316"/>
    <path d="M27 40 L25 22 L42 32 Z" fill="#FED7AA"/><path d="M93 40 L95 22 L78 32 Z" fill="#FED7AA"/>
    ${arms}
    <rect x="34" y="92" width="52" height="46" rx="22" fill="url(#gBody)"/>
    <ellipse cx="60" cy="118" rx="16" ry="15" fill="#FFF7ED"/>
    <path d="M60 110 l-5 9 h7 l-3 9 9 -12 h-7 l3 -6z" fill="#F97316"/>
    <rect x="16" y="24" width="88" height="72" rx="34" fill="url(#gBody)"/>
    <rect x="27" y="38" width="66" height="44" rx="22" fill="#0F172A"/>
    <ellipse class="g-eye" cx="46" cy="${eyeY}" rx="7" ry="9" fill="#22D3EE"/>
    <ellipse class="g-eye" cx="74" cy="${eyeY}" rx="7" ry="9" fill="#22D3EE"/>
    <circle cx="48" cy="${eyeY - 3}" r="2.4" fill="#fff"/><circle cx="76" cy="${eyeY - 3}" r="2.4" fill="#fff"/>
    ${mouth}
    <circle cx="30" cy="88" r="5" fill="#FB7185" opacity=".55"/><circle cx="90" cy="88" r="5" fill="#FB7185" opacity=".55"/>
    ${sparks}
  </g></svg>`;
}

// ---------------------------------------------------------------- شکل‌های الگو
function starPoints(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return pts.join(" ");
}
function hexPoints(cx, cy, R) {
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}
export function shape(spec, cls = "") {
  const k = { s: 0.55, m: 0.78, l: 1 }[spec.size || "m"];
  const R = 40 * k;
  const paint = spec.ring ? `fill="none" stroke="${spec.color}" stroke-width="8"` : `fill="${spec.color}" stroke="rgba(255,255,255,.55)" stroke-width="2"`;
  let el = "";
  switch (spec.shape) {
    case "circle": el = `<circle cx="50" cy="50" r="${R}" ${paint}/>`; break;
    case "square": el = `<rect x="${50 - R}" y="${50 - R}" width="${2 * R}" height="${2 * R}" rx="8" ${paint}/>`; break;
    case "triangle": el = `<polygon points="50,${50 - R} ${50 + R * 1.05},${50 + R * 0.8} ${50 - R * 1.05},${50 + R * 0.8}" ${paint} stroke-linejoin="round"/>`; break;
    case "diamond": el = `<polygon points="50,${50 - R * 1.1} ${50 + R * 0.8},50 50,${50 + R * 1.1} ${50 - R * 0.8},50" ${paint} stroke-linejoin="round"/>`; break;
    case "star": el = `<polygon points="${starPoints(50, 52, R * 1.1, R * 0.48)}" ${paint} stroke-linejoin="round"/>`; break;
    case "hex": el = `<polygon points="${hexPoints(50, 50, R)}" ${paint} stroke-linejoin="round"/>`; break;
  }
  return `<svg class="pshape ${cls}" viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${spec.rot || 0} 50 50)">${el}</g></svg>`;
}

// ---------------------------------------------------------------- آیکون‌ها
const P = { o: "#F97316", y: "#FACC15", b: "#38BDF8", g: "#34D399", p: "#A78BFA", r: "#FB7185", s: "#94A3B8", d: "#1E293B", w: "#F8FAFC", br: "#B45309" };

function gearShape(cx, cy, r, teeth, fill) {
  let t = "";
  for (let i = 0; i < teeth; i++) t += `<rect x="${cx - r * 0.16}" y="${cy - r * 1.28}" width="${r * 0.32}" height="${r * 0.46}" rx="1.5" fill="${fill}" transform="rotate(${(360 / teeth) * i} ${cx} ${cy})"/>`;
  return `${t}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.38}" fill="rgba(15,23,42,.55)"/>`;
}

const ICONS = {
  // رویکردها
  analytic: () => `<circle cx="27" cy="27" r="14" fill="${P.b}" fill-opacity=".25" stroke="${P.b}" stroke-width="5"/><path d="M38 38 L54 54" stroke="${P.o}" stroke-width="7" stroke-linecap="round"/><rect x="19" y="27" width="4" height="9" fill="${P.w}"/><rect x="26" y="21" width="4" height="15" fill="${P.w}"/><rect x="33" y="25" width="4" height="11" fill="${P.w}"/>`,
  hands_on: () => `${gearShape(26, 36, 12, 8, P.y)}<path d="M36 14 L52 14 L52 20 L44 20 L44 52 Q44 56 40 56 Q36 56 36 52 Z" fill="${P.s}" transform="rotate(25 44 36)"/>`,
  creative: () => `<path d="M32 8 C18 8 12 20 16 30 C18 35 22 38 22 44 H42 C42 38 46 35 48 30 C52 20 46 8 32 8Z" fill="${P.y}"/><rect x="23" y="46" width="18" height="5" rx="2" fill="${P.s}"/><rect x="26" y="53" width="12" height="5" rx="2.5" fill="${P.s}"/><path d="M28 24 Q32 18 36 24" stroke="${P.br}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 14 l4 4 M56 14 l-4 4 M4 30 h5 M55 30 h5" stroke="${P.o}" stroke-width="3" stroke-linecap="round"/>`,
  collaborative: () => `<circle cx="32" cy="20" r="9" fill="${P.o}"/><path d="M16 50 Q16 32 32 32 Q48 32 48 50Z" fill="${P.o}"/><circle cx="12" cy="26" r="7" fill="${P.b}"/><path d="M0 50 Q0 36 12 36 Q20 36 22 42 L22 50Z" fill="${P.b}"/><circle cx="52" cy="26" r="7" fill="${P.g}"/><path d="M64 50 Q64 36 52 36 Q44 36 42 42 L42 50Z" fill="${P.g}"/>`,
  decisive: () => `<rect x="14" y="8" width="5" height="50" rx="2.5" fill="${P.s}"/><path d="M19 10 H50 L42 22 L50 34 H19Z" fill="${P.o}"/>`,
  systematic: () => `<rect x="8" y="40" width="14" height="16" fill="${P.b}"/><rect x="25" y="28" width="14" height="28" fill="${P.g}"/><rect x="42" y="14" width="14" height="42" fill="${P.o}"/><path d="M10 34 L28 22 L46 8" stroke="${P.w}" stroke-width="3" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>`,
  // ابزارهای کوله
  scanner: () => `<rect x="14" y="8" width="36" height="48" rx="8" fill="${P.d}" stroke="${P.b}" stroke-width="3"/><rect x="19" y="14" width="26" height="26" rx="4" fill="#0B3B53"/><path d="M22 34 L28 26 L34 31 L42 20" stroke="${P.g}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="48" r="4" fill="${P.o}"/>`,
  toolbox: () => `<rect x="8" y="22" width="48" height="32" rx="5" fill="${P.o}"/><path d="M22 22 V16 Q22 12 26 12 H38 Q42 12 42 16 V22" stroke="${P.s}" stroke-width="5" fill="none"/><rect x="8" y="34" width="48" height="5" fill="#C2410C"/><rect x="28" y="31" width="8" height="11" rx="2" fill="${P.y}"/>`,
  ideaboard: () => `<rect x="6" y="10" width="52" height="38" rx="5" fill="#F1F5F9" stroke="${P.s}" stroke-width="3"/><circle cx="32" cy="26" r="9" fill="${P.y}"/><rect x="28" y="35" width="8" height="4" rx="2" fill="${P.s}"/><path d="M12 42 h12 M40 42 h12" stroke="${P.p}" stroke-width="3" stroke-linecap="round"/><path d="M22 52 L18 60 M42 52 L46 60" stroke="${P.s}" stroke-width="3" stroke-linecap="round"/>`,
  radio: () => `<rect x="20" y="16" width="26" height="44" rx="6" fill="${P.d}" stroke="${P.g}" stroke-width="3"/><rect x="25" y="23" width="16" height="12" rx="2" fill="#064E3B"/><circle cx="33" cy="46" r="5" fill="${P.o}"/><path d="M42 16 L48 4" stroke="${P.s}" stroke-width="4" stroke-linecap="round"/><path d="M52 10 Q58 16 52 22 M56 6 Q64 16 56 26" stroke="${P.g}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  commandmap: () => `<path d="M6 14 L22 8 L42 14 L58 8 V50 L42 56 L22 50 L6 56Z" fill="#FDE68A" stroke="${P.br}" stroke-width="2"/><path d="M22 8 V50 M42 14 V56" stroke="${P.br}" stroke-width="2"/><path d="M32 22 q7 0 7 7 q0 6 -7 12 q-7 -6 -7 -12 q0 -7 7 -7z" fill="${P.r}"/><circle cx="32" cy="29" r="2.5" fill="${P.w}"/>`,
  checklist: () => `<rect x="12" y="8" width="40" height="50" rx="5" fill="#F8FAFC" stroke="${P.s}" stroke-width="3"/><rect x="24" y="4" width="16" height="9" rx="3" fill="${P.s}"/><path d="M19 24 l3 3 6 -7 M19 38 l3 3 6 -7" stroke="${P.g}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M33 25 h13 M33 39 h13" stroke="${P.s}" stroke-width="3" stroke-linecap="round"/>`,
  // ابزارهای انبار
  ruler: () => `<g transform="rotate(-35 32 32)"><rect x="2" y="24" width="60" height="16" rx="3" fill="${P.y}"/><path d="M10 24v7M18 24v5M26 24v7M34 24v5M42 24v7M50 24v5" stroke="${P.br}" stroke-width="2"/></g>`,
  scale: () => `<path d="M32 10 V50" stroke="${P.s}" stroke-width="4"/><rect x="16" y="50" width="32" height="6" rx="3" fill="${P.s}"/><path d="M8 20 H56" stroke="${P.s}" stroke-width="4" stroke-linecap="round"/><path d="M8 20 L2 34 H14Z M56 20 L50 34 H62Z" fill="${P.b}"/><circle cx="32" cy="10" r="4" fill="${P.o}"/>`,
  thermo: () => `<rect x="26" y="6" width="12" height="38" rx="6" fill="#F1F5F9" stroke="${P.s}" stroke-width="3"/><circle cx="32" cy="48" r="10" fill="${P.r}"/><rect x="29.5" y="20" width="5" height="28" rx="2.5" fill="${P.r}"/><path d="M42 14 h6 M42 24 h6 M42 34 h6" stroke="${P.s}" stroke-width="3" stroke-linecap="round"/>`,
  hammer: () => `<rect x="29" y="22" width="7" height="38" rx="3" fill="${P.br}"/><rect x="12" y="8" width="38" height="16" rx="4" fill="${P.s}"/><rect x="40" y="8" width="10" height="16" rx="3" fill="#64748B"/>`,
  screwdriver: () => `<rect x="26" y="4" width="12" height="26" rx="5" fill="${P.o}"/><rect x="29" y="30" width="6" height="22" fill="${P.s}"/><path d="M29 52 h6 l-1 8 h-4z" fill="#64748B"/>`,
  scissors: () => `<circle cx="18" cy="48" r="9" fill="none" stroke="${P.r}" stroke-width="5"/><circle cx="46" cy="48" r="9" fill="none" stroke="${P.r}" stroke-width="5"/><path d="M24 40 L46 6 M40 40 L18 6" stroke="${P.s}" stroke-width="5" stroke-linecap="round"/>`,
  notebook: () => `<rect x="12" y="6" width="40" height="52" rx="5" fill="${P.p}"/><rect x="18" y="6" width="34" height="52" rx="4" fill="#EDE9FE"/><path d="M24 20 h22 M24 30 h22 M24 40 h14" stroke="${P.p}" stroke-width="3" stroke-linecap="round"/><path d="M12 14 h8 M12 26 h8 M12 38 h8 M12 50 h8" stroke="${P.s}" stroke-width="3"/>`,
  calendar: () => `<rect x="8" y="12" width="48" height="44" rx="6" fill="#F8FAFC"/><rect x="8" y="12" width="48" height="14" rx="6" fill="${P.r}"/><rect x="18" y="6" width="5" height="12" rx="2.5" fill="${P.s}"/><rect x="41" y="6" width="5" height="12" rx="2.5" fill="${P.s}"/><g fill="${P.s}"><rect x="15" y="32" width="8" height="6" rx="1.5"/><rect x="28" y="32" width="8" height="6" rx="1.5"/><rect x="41" y="32" width="8" height="6" rx="1.5"/><rect x="15" y="43" width="8" height="6" rx="1.5"/></g><rect x="28" y="43" width="8" height="6" rx="1.5" fill="${P.o}"/>`,
  bin_measure: () => `<rect x="6" y="18" width="52" height="38" rx="6" fill="#0E7490"/><rect x="6" y="18" width="52" height="9" rx="4" fill="#155E75"/><g transform="translate(18 26) scale(.4)">${ICONS.ruler()}</g><path d="M14 46 h36" stroke="${P.b}" stroke-width="3" stroke-dasharray="3 3"/>`,
  bin_build: () => `<rect x="6" y="18" width="52" height="38" rx="6" fill="#B45309"/><rect x="6" y="18" width="52" height="9" rx="4" fill="#92400E"/><g transform="translate(18 26) scale(.4)">${ICONS.hammer()}</g><path d="M14 46 h36" stroke="${P.y}" stroke-width="3" stroke-dasharray="3 3"/>`,
  bin_plan: () => `<rect x="6" y="18" width="52" height="38" rx="6" fill="#6D28D9"/><rect x="6" y="18" width="52" height="9" rx="4" fill="#5B21B6"/><g transform="translate(18 26) scale(.4)">${ICONS.calendar()}</g><path d="M14 46 h36" stroke="${P.p}" stroke-width="3" stroke-dasharray="3 3"/>`,
  // آیتم‌های غرفه
  d_screen: () => `<rect x="6" y="10" width="52" height="34" rx="5" fill="${P.d}" stroke="${P.s}" stroke-width="3"/><rect x="11" y="15" width="42" height="24" rx="2" fill="#0B3B53"/><path d="M15 33 L24 24 L31 30 L45 19" stroke="${P.g}" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="26" y="44" width="12" height="7" fill="${P.s}"/><rect x="18" y="51" width="28" height="5" rx="2.5" fill="${P.s}"/>`,
  d_robot: () => `<line x1="32" y1="4" x2="32" y2="12" stroke="${P.s}" stroke-width="3"/><circle cx="32" cy="4" r="3.5" fill="${P.r}"/><rect x="14" y="12" width="36" height="26" rx="9" fill="${P.s}"/><circle cx="24" cy="25" r="5" fill="${P.b}"/><circle cx="40" cy="25" r="5" fill="${P.b}"/><rect x="18" y="40" width="28" height="18" rx="6" fill="${P.o}"/><rect x="6" y="42" width="8" height="12" rx="4" fill="${P.s}"/><rect x="50" y="42" width="8" height="12" rx="4" fill="${P.s}"/>`,
  d_rocket: () => `<path d="M32 4 C44 12 46 28 42 42 H22 C18 28 20 12 32 4Z" fill="#F1F5F9"/><circle cx="32" cy="22" r="6" fill="${P.b}"/><path d="M22 34 L10 48 L22 44Z M42 34 L54 48 L42 44Z" fill="${P.r}"/><path d="M26 44 H38 L32 60Z" fill="${P.o}"/>`,
  d_gears: () => `${gearShape(24, 38, 14, 9, P.s)}${gearShape(46, 20, 10, 8, P.y)}`,
  d_painting: () => `<rect x="6" y="8" width="52" height="44" rx="3" fill="${P.br}"/><rect x="11" y="13" width="42" height="34" fill="#BAE6FD"/><circle cx="42" cy="23" r="5" fill="${P.y}"/><path d="M11 47 L24 30 L33 40 L40 33 L53 47Z" fill="${P.g}"/>`,
  d_balloons: () => `<ellipse cx="20" cy="20" rx="11" ry="14" fill="${P.r}"/><ellipse cx="40" cy="16" rx="11" ry="14" fill="${P.b}"/><ellipse cx="32" cy="32" rx="10" ry="13" fill="${P.y}"/><path d="M20 34 Q24 48 32 58 M40 30 Q36 46 32 58 M32 45 L32 58" stroke="${P.s}" stroke-width="2" fill="none"/>`,
  d_banner: () => `<path d="M6 8 H58 V40 L48 34 L38 40 L28 34 L18 40 L6 34Z" fill="${P.p}"/><path d="M14 18 h36 M14 26 h24" stroke="#fff" stroke-width="4" stroke-linecap="round"/><rect x="4" y="6" width="4" height="52" rx="2" fill="${P.s}"/>`,
  d_plant: () => `<path d="M32 38 C20 36 14 24 18 12 C28 14 34 24 32 38Z" fill="${P.g}"/><path d="M32 38 C44 36 50 26 46 14 C36 16 30 26 32 38Z" fill="#10B981"/><path d="M18 40 H46 L42 58 H22Z" fill="${P.o}"/>`,
  d_globe: () => `<circle cx="32" cy="30" r="22" fill="${P.b}"/><path d="M18 22 Q26 16 30 24 Q26 32 20 30Z M36 36 Q46 30 50 38 Q44 48 36 44Z" fill="${P.g}"/><path d="M14 52 H50 M22 56 H42" stroke="${P.s}" stroke-width="4" stroke-linecap="round"/>`,
  d_mic: () => `<rect x="24" y="4" width="16" height="30" rx="8" fill="${P.s}"/><path d="M16 28 Q16 44 32 44 Q48 44 48 28" stroke="${P.o}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M32 44 V54 M22 56 H42" stroke="${P.o}" stroke-width="4" stroke-linecap="round"/>`,
  d_chairs: () => `<rect x="8" y="26" width="20" height="12" rx="3" fill="${P.o}"/><rect x="8" y="14" width="6" height="14" rx="2" fill="#C2410C"/><path d="M12 38 V52 M24 38 V52" stroke="${P.s}" stroke-width="3"/><rect x="36" y="26" width="20" height="12" rx="3" fill="${P.b}"/><rect x="50" y="14" width="6" height="14" rx="2" fill="#0369A1"/><path d="M40 38 V52 M52 38 V52" stroke="${P.s}" stroke-width="3"/>`,
  d_lamp: () => `<path d="M18 28 L26 8 H38 L46 28Z" fill="${P.y}"/><rect x="29" y="28" width="6" height="22" fill="${P.s}"/><rect x="20" y="50" width="24" height="6" rx="3" fill="${P.s}"/>`,
  d_table: () => `<rect x="6" y="20" width="52" height="8" rx="3" fill="${P.br}"/><rect x="12" y="28" width="5" height="26" fill="#92400E"/><rect x="47" y="28" width="5" height="26" fill="#92400E"/><circle cx="24" cy="15" r="5" fill="${P.r}"/>`,
  d_shelf: () => `<rect x="8" y="6" width="48" height="52" rx="3" fill="${P.br}"/><rect x="12" y="10" width="40" height="20" fill="#78350F"/><rect x="12" y="34" width="40" height="20" fill="#78350F"/><rect x="16" y="16" width="8" height="14" fill="${P.b}"/><rect x="26" y="12" width="7" height="18" fill="${P.o}"/><rect x="35" y="18" width="10" height="12" fill="${P.g}"/><rect x="16" y="42" width="14" height="12" rx="2" fill="${P.p}"/><circle cx="42" cy="48" r="6" fill="${P.y}"/>`,
  // نشان‌ها و ایستگاه‌ها
  compass: () => `<circle cx="32" cy="32" r="22" fill="#F8FAFC" stroke="${P.b}" stroke-width="5"/><path d="M32 14 L38 32 L32 50 L26 32Z" fill="${P.o}"/><path d="M32 14 L38 32 H26Z" fill="${P.r}"/><circle cx="32" cy="32" r="3" fill="${P.d}"/>`,
  bolt: () => `<path d="M36 4 L14 36 H28 L24 60 L50 26 H34Z" fill="${P.y}" stroke="${P.o}" stroke-width="3" stroke-linejoin="round"/>`,
  magnifier: () => ICONS.analytic(),
  pattern: () => `<circle cx="16" cy="18" r="9" fill="${P.o}"/><rect x="38" y="9" width="18" height="18" rx="3" fill="${P.b}"/><polygon points="16,56 6,38 26,38" fill="${P.g}"/><circle cx="47" cy="47" r="9" fill="none" stroke="${P.p}" stroke-width="4" stroke-dasharray="4 3"/>`,
  eye: () => `<path d="M4 32 Q32 6 60 32 Q32 58 4 32Z" fill="#F8FAFC" stroke="${P.s}" stroke-width="3"/><circle cx="32" cy="32" r="11" fill="${P.o}"/><circle cx="32" cy="32" r="5" fill="${P.d}"/><circle cx="36" cy="28" r="2.5" fill="#fff"/>`,
  shelf: () => ICONS.d_shelf(),
  palette: () => `<path d="M32 6 C16 6 4 18 4 32 C4 46 16 58 30 58 C36 58 36 52 33 49 C30 46 32 40 38 40 H48 C54 40 60 36 60 30 C60 16 48 6 32 6Z" fill="#FDE68A" stroke="${P.br}" stroke-width="2"/><circle cx="18" cy="28" r="5" fill="${P.r}"/><circle cx="28" cy="16" r="5" fill="${P.b}"/><circle cx="42" cy="16" r="5" fill="${P.g}"/><circle cx="50" cy="28" r="5" fill="${P.p}"/>`,
  rebound: () => `<path d="M10 40 Q10 14 36 14 L36 6 L56 20 L36 34 L36 26 Q22 26 22 40Z" fill="${P.o}"/><path d="M14 52 H50" stroke="${P.s}" stroke-width="4" stroke-linecap="round"/>`,
  plug: () => `<rect x="14" y="22" width="36" height="22" rx="6" fill="${P.s}"/><rect x="21" y="6" width="7" height="18" rx="2" fill="${P.y}"/><rect x="36" y="6" width="7" height="18" rx="2" fill="${P.y}"/><path d="M32 44 V54 Q32 60 40 60" stroke="${P.s}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 26 l-6 8 h5 l-2 8 8 -10 h-5z" fill="${P.o}"/>`,
  rocket: () => ICONS.d_rocket(),
  trophy: () => `<path d="M16 6 H48 V26 Q48 40 32 42 Q16 40 16 26Z" fill="${P.y}" stroke="${P.o}" stroke-width="2"/><path d="M16 12 H6 Q6 28 18 30 M48 12 H58 Q58 28 46 30" stroke="${P.y}" stroke-width="4" fill="none"/><rect x="28" y="42" width="8" height="8" fill="${P.o}"/><rect x="18" y="50" width="28" height="8" rx="3" fill="${P.br}"/>`,
  star: () => `<polygon points="${starPoints(32, 34, 28, 12)}" fill="${P.y}" stroke="${P.o}" stroke-width="3" stroke-linejoin="round"/>`,
  heart: () => `<path d="M32 56 C8 38 6 22 18 14 C26 9 32 16 32 20 C32 16 38 9 46 14 C58 22 56 38 32 56Z" fill="${P.r}"/>`,
  check: () => `<circle cx="32" cy="32" r="26" fill="${P.g}"/><path d="M19 33 L28 42 L46 22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  cross: () => `<circle cx="32" cy="32" r="26" fill="${P.r}"/><path d="M22 22 L42 42 M42 22 L22 42" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  battery: () => `<rect x="6" y="18" width="46" height="28" rx="6" fill="${P.d}" stroke="${P.g}" stroke-width="3"/><rect x="52" y="26" width="6" height="12" rx="2" fill="${P.g}"/><path d="M26 22 l-7 11 h7 l-3 9 11 -13 h-7 l3 -7z" fill="${P.y}"/>`,
  lamp_on: () => `<path d="M32 6 C20 6 14 16 18 26 C20 30 24 33 24 38 H40 C40 33 44 30 46 26 C50 16 44 6 32 6Z" fill="${P.y}" filter="url(#fGlow)"/><rect x="25" y="40" width="14" height="5" rx="2" fill="${P.s}"/><rect x="27" y="47" width="10" height="5" rx="2.5" fill="${P.s}"/>`,
  lock: () => `<rect x="14" y="28" width="36" height="28" rx="6" fill="${P.s}"/><path d="M22 28 V20 Q22 10 32 10 Q42 10 42 20 V28" stroke="${P.s}" stroke-width="5" fill="none"/>`,
  // محیط‌های جزیره (آیکون کوچک)
  zone_workshop: () => `${gearShape(26, 34, 14, 9, P.y)}${ICONS.hammer().replace(/<rect/g, "<rect")}`,
  clock: () => `<circle cx="32" cy="32" r="24" fill="#F8FAFC" stroke="${P.s}" stroke-width="4"/><path d="M32 16 V32 L44 38" stroke="${P.d}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};

// نام‌های مستعار
ICONS.st_pattern = ICONS.pattern;
ICONS.st_sort = ICONS.d_shelf;
ICONS.st_design = ICONS.palette;
ICONS.st_circuit = ICONS.plug;

export function icon(name, cls = "") {
  const f = ICONS[name];
  return f ? svg(f(), "0 0 64 64", cls) : "";
}

export function badgeArt(b, locked = false) {
  return `<div class="badge-art ${locked ? "is-locked" : ""}" style="--bc:${b.color}">
    <div class="badge-art__ring">${locked ? icon("lock") : icon(b.icon)}</div></div>`;
}

// ---------------------------------------------------------------- کاشی لوله (مدار)
export function pipeTile(type) {
  const pipe = `fill="#475569" stroke="#94A3B8" stroke-width="2"`;
  const core = `fill="#64748B"`;
  const paths = {
    straight: `<rect x="24" y="0" width="16" height="64" ${pipe}/><rect x="28" y="0" width="8" height="64" class="pipe-core" ${core}/>`,
    corner: `<path d="M24 0 H40 V24 H64 V40 H24Z" ${pipe}/><path d="M28 0 H36 V28 H64 V36 H28Z" class="pipe-core" ${core}/>`,
    tee: `<path d="M24 0 H40 V24 H64 V40 H40 V40 H24 V40 H0 V24 H24Z" ${pipe}/><path d="M28 0 H36 V28 H64 V36 H0 V28 H28Z" class="pipe-core" ${core}/>`,
  };
  // کاشی «tee» باید جهت‌های بالا/راست/چپ را داشته باشد (مطابق سرور)
  return `<svg class="pipe pipe--${type}" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="13" fill="#334155" stroke="#94A3B8" stroke-width="2"/>${paths[type]}<circle cx="32" cy="32" r="7" class="pipe-hub" fill="#1E293B"/></svg>`;
}

// صحنه‌های تصویری چهار مرحله (SVG اختصاصی)

function gear(r, teeth, fill) {
  let t = "";
  for (let i = 0; i < teeth; i++) t += `<rect x="${-r * 0.17}" y="${-r * 1.3}" width="${r * 0.34}" height="${r * 0.5}" rx="2" fill="${fill}" transform="rotate(${(360 / teeth) * i})"/>`;
  return `${t}<circle r="${r}" fill="${fill}"/><circle r="${r * 0.38}" fill="rgba(15,23,42,.5)"/>`;
}

// ساختمان‌های جزیره در مختصات محلی: مبدأ = وسط پایین ساختمان
const BUILDING = {
  workshop: () => `
    <ellipse cx="0" cy="6" rx="100" ry="14" fill="#000" opacity=".18"/>
    <rect x="-78" y="-92" width="156" height="92" rx="6" fill="#F59E0B"/>
    <path d="M-94 -88 L0 -152 L94 -88Z" fill="#B45309"/>
    <rect x="-26" y="-62" width="52" height="62" rx="4" fill="#78350F"/>
    <path d="M-26 -62 L26 0 M26 -62 L-26 0" stroke="#92400E" stroke-width="5"/>
    <circle cx="-54" cy="-62" r="12" fill="#FDE68A"/><circle cx="54" cy="-62" r="12" fill="#FDE68A"/>
    <rect x="56" y="-146" width="18" height="40" fill="#78350F"/>
    <circle class="smoke" cx="65" cy="-156" r="9" fill="#fff" opacity=".7"/><circle class="smoke s2" cx="70" cy="-172" r="12" fill="#fff" opacity=".5"/>
    <g transform="translate(0 -112)"><g class="spin">${gear(14, 8, "#FCD34D")}</g></g>
    <rect x="-96" y="-26" width="9" height="26" rx="3" fill="#94A3B8" transform="rotate(-14 -90 0)"/>`,
  lab: () => `
    <ellipse cx="0" cy="6" rx="100" ry="14" fill="#000" opacity=".18"/>
    <rect x="-80" y="-56" width="160" height="56" rx="6" fill="#F1F5F9"/>
    <path d="M-72 -56 A72 72 0 0 1 72 -56Z" fill="url(#gGlass)" stroke="#fff" stroke-width="4"/>
    <path d="M-40 -90 Q-30 -118 -6 -120" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
    <rect x="-22" y="-34" width="44" height="34" rx="4" fill="#0EA5E9"/>
    <g transform="translate(-56 -30)"><path d="M-6 -22 h12 v10 l10 20 a5 5 0 0 1 -4 8 h-24 a5 5 0 0 1 -4 -8 l10 -20z" fill="#A78BFA"/><circle class="bubble" cx="-2" cy="-4" r="3" fill="#fff"/></g>
    <g transform="translate(58 -62) rotate(-30)"><rect x="-4" y="-34" width="8" height="40" rx="3" fill="#475569"/><rect x="-7" y="-44" width="14" height="14" rx="3" fill="#94A3B8"/></g>
    <circle class="pulse" cx="0" cy="-70" r="8" fill="#F472B6"/>`,
  studio: () => `
    <ellipse cx="0" cy="6" rx="100" ry="14" fill="#000" opacity=".18"/>
    <rect x="-70" y="-86" width="140" height="86" rx="8" fill="#F472B6"/>
    <path d="M-86 -82 L0 -146 L86 -82Z" fill="#A855F7"/>
    <path d="M-60 -82 L0 -126 L60 -82" stroke="#FDE047" stroke-width="5" fill="none" stroke-dasharray="10 8"/>
    <rect x="-24" y="-56" width="48" height="56" rx="24" fill="#4C1D95"/>
    <g transform="translate(-92 0)"><path d="M0 0 L-12 -70 M0 0 L12 -70 M0 -30 H0" stroke="#78350F" stroke-width="5"/><rect x="-22" y="-84" width="44" height="34" rx="3" fill="#fff" stroke="#78350F" stroke-width="4"/><circle cx="-6" cy="-70" r="6" fill="#38BDF8"/><circle cx="8" cy="-62" r="5" fill="#FB7185"/></g>
    <g transform="translate(92 -18)"><ellipse rx="22" ry="16" fill="#FDE68A" stroke="#B45309" stroke-width="3"/><circle cx="-8" cy="-4" r="4" fill="#FB7185"/><circle cx="6" cy="-7" r="4" fill="#38BDF8"/><circle cx="10" cy="5" r="4" fill="#34D399"/></g>`,
  hub: () => `
    <ellipse cx="0" cy="6" rx="104" ry="14" fill="#000" opacity=".18"/>
    <rect x="-84" y="-76" width="168" height="76" rx="6" fill="#34D399"/>
    <path d="M-96 -76 L0 -124 L96 -76Z" fill="#059669"/>
    <rect x="-46" y="-62" width="92" height="40" rx="4" fill="#064E3B"/><path d="M-36 -48 h40 M-36 -38 h60 M-36 -30 h30" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <rect x="-18" y="-22" width="36" height="22" fill="#047857"/>
    <g transform="translate(0 -124)"><line y2="-26" stroke="#475569" stroke-width="3"/><path d="M0 -26 H22 L16 -19 L22 -12 H0Z" fill="#F97316"/></g>
    <g class="people"><circle cx="-64" cy="-8" r="8" fill="#FDBA74"/><rect x="-72" y="-2" width="16" height="12" rx="6" fill="#F97316"/><circle cx="64" cy="-8" r="8" fill="#FDE68A"/><rect x="56" y="-2" width="16" height="12" rx="6" fill="#38BDF8"/><circle cx="92" cy="-6" r="7" fill="#FBCFE8"/><rect x="85" y="-1" width="14" height="10" rx="5" fill="#A78BFA"/></g>`,
  command: () => `
    <ellipse cx="0" cy="6" rx="84" ry="13" fill="#000" opacity=".18"/>
    <rect x="-40" y="-150" width="80" height="150" rx="8" fill="#94A3B8"/>
    <rect x="-52" y="-30" width="104" height="30" rx="6" fill="#64748B"/>
    <g fill="#FDE68A"><rect x="-26" y="-132" width="14" height="14" rx="2"/><rect x="-4" y="-132" width="14" height="14" rx="2"/><rect x="18" y="-132" width="10" height="14" rx="2"/><rect x="-26" y="-108" width="14" height="14" rx="2"/><rect x="-4" y="-108" width="14" height="14" rx="2"/><rect x="18" y="-108" width="10" height="14" rx="2"/><rect x="-26" y="-84" width="14" height="14" rx="2"/><rect x="-4" y="-84" width="14" height="14" rx="2"/><rect x="18" y="-84" width="10" height="14" rx="2"/></g>
    <circle cx="0" cy="-168" r="18" fill="#F8FAFC" stroke="#475569" stroke-width="4"/><path d="M0 -180 V-168 L9 -162" stroke="#1E293B" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g class="floaty" transform="translate(74 -110)"><rect x="-24" y="-20" width="48" height="36" rx="5" fill="#0F172A" stroke="#22D3EE" stroke-width="3"/><rect x="-16" y="-2" width="7" height="12" fill="#34D399"/><rect x="-5" y="-10" width="7" height="20" fill="#FACC15"/><rect x="6" y="-14" width="7" height="24" fill="#F97316"/></g>
    <rect x="-20" y="-26" width="40" height="26" rx="4" fill="#334155"/>`,
  tech: () => `
    <ellipse cx="0" cy="6" rx="100" ry="14" fill="#000" opacity=".18"/>
    <rect x="-78" y="-84" width="156" height="84" rx="8" fill="#6366F1"/>
    <rect x="-64" y="-72" width="128" height="52" rx="5" fill="#0B1020" stroke="#22D3EE" stroke-width="3"/>
    <text x="-50" y="-38" font-family="monospace" font-size="22" fill="#34D399" direction="ltr">&lt;/&gt; run()</text>
    <rect class="cursor" x="42" y="-52" width="8" height="18" fill="#22D3EE"/>
    <rect x="-30" y="-14" width="60" height="10" rx="3" fill="#4338CA"/>
    <g transform="translate(70 -84)"><line y2="-46" stroke="#94A3B8" stroke-width="4"/><circle class="pulse" cy="-50" r="8" fill="#F472B6"/><path d="M-14 -62 Q0 -76 14 -62 M-22 -70 Q0 -92 22 -70" stroke="#F472B6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>
    <g transform="translate(-92 -2)"><rect x="-12" y="-30" width="24" height="30" rx="6" fill="#94A3B8"/><circle cx="-4" cy="-20" r="3" fill="#22D3EE"/><circle cx="4" cy="-20" r="3" fill="#22D3EE"/></g>`,
};

export const ZONE_TITLE_SHORT = { workshop: "کارگاه", lab: "آزمایشگاه", studio: "استودیو", hub: "فضای آموزش", command: "مرکز مدیریت", tech: "اتاق فناوری" };

export function zoneArt(id) {
  return `<svg class="zone-art" viewBox="-130 -200 260 220" aria-hidden="true">${BUILDING[id]()}</svg>`;
}

// ---------------------------------------------------------------- مرحله ۱: جزیره
export const ISLAND_POS = {
  lab: [300, 330, 0.85], tech: [600, 290, 0.8], studio: [900, 335, 0.85],
  workshop: [215, 540, 1], command: [600, 560, 1], hub: [985, 545, 1],
};

export function islandScene(titles) {
  const zones = Object.entries(ISLAND_POS).map(([id, [x, y, s]]) => `
    <g class="zone" data-zone="${id}" tabindex="0" role="button" aria-label="${titles[id] || id}" transform="translate(${x} ${y})">
      <g class="zone-body" transform="scale(${s})">${BUILDING[id]()}</g>
      ${titles[id] === "" ? "" : `<g class="zone-sign" transform="translate(0 ${34 * s})">
        <rect x="-74" y="-4" width="148" height="30" rx="15" fill="#0F172A" opacity=".82"/>
        <text x="0" y="17" text-anchor="middle" font-size="16" fill="#fff" class="sign-text">${ZONE_TITLE_SHORT[id] || titles[id] || id}</text>
      </g>`}
      <g class="zone-mark" transform="translate(0 ${-190 * s})"></g>
    </g>`).join("");
  const palms = [[110, 420], [1090, 430], [450, 450], [760, 450]].map(([x, y]) => `
    <g transform="translate(${x} ${y})"><rect x="-4" y="-50" width="8" height="52" rx="3" fill="#92400E"/>
    <g class="sway"><path d="M0 -50 Q-34 -64 -48 -40 Q-22 -50 0 -50Z M0 -50 Q34 -64 48 -40 Q22 -50 0 -50Z M0 -50 Q-10 -84 -34 -84 Q-12 -70 0 -50Z M0 -50 Q10 -84 34 -84 Q12 -70 0 -50Z" fill="#16A34A"/></g></g>`).join("");
  return `<svg class="scene island" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="720" fill="url(#gSkyDay)"/>
    <circle class="sun" cx="1010" cy="110" r="90" fill="url(#gSun)"/>
    <g class="cloud c1"><ellipse cx="200" cy="100" rx="70" ry="26" fill="#fff" opacity=".9"/><ellipse cx="250" cy="86" rx="46" ry="26" fill="#fff" opacity=".9"/></g>
    <g class="cloud c2"><ellipse cx="640" cy="60" rx="60" ry="20" fill="#fff" opacity=".8"/><ellipse cx="682" cy="48" rx="38" ry="20" fill="#fff" opacity=".8"/></g>
    <rect y="500" width="1200" height="220" fill="url(#gSea)"/>
    <path class="wave w1" d="M-100 540 Q-40 520 20 540 T140 540 T260 540 T380 540 T500 540 T620 540 T740 540 T860 540 T980 540 T1100 540 T1220 540 V720 H-100Z" fill="#38BDF8" opacity=".35"/>
    <path class="wave w2" d="M-100 600 Q-40 580 20 600 T140 600 T260 600 T380 600 T500 600 T620 600 T740 600 T860 600 T980 600 T1100 600 T1220 600 V720 H-100Z" fill="#0EA5E9" opacity=".35"/>
    <ellipse cx="600" cy="560" rx="560" ry="150" fill="url(#gSand)"/>
    <ellipse cx="600" cy="530" rx="520" ry="132" fill="url(#gGrass)"/>
    <path d="M215 540 C 330 470 450 400 600 370 C 760 400 870 470 985 545" stroke="#FEF3C7" stroke-width="10" fill="none" stroke-dasharray="2 18" stroke-linecap="round" opacity=".8"/>
    ${palms}${zones}</svg>`;
}

// ---------------------------------------------------------------- مرحله ۲: شهر
export const CITY_SPOTS = { control: [220, 300], power: [980, 330], square: [600, 440] };

export function cityScene() {
  const rnd = (i) => ((i * 9301 + 49297) % 233280) / 233280;
  let towers = "", wins = "", idx = 0;
  const xs = [];
  for (let x = 0, i = 0; x < 1200; i++) {
    const w = 60 + Math.floor(rnd(i + 3) * 50);
    const h = 90 + Math.floor(rnd(i + 7) * 190);
    xs.push([x, w, h]);
    x += w + 6;
  }
  for (const [x, w, h] of xs) {
    towers += `<rect x="${x}" y="${470 - h}" width="${w}" height="${h}" fill="#1E293B"/>`;
    for (let wy = 470 - h + 14; wy < 450; wy += 22) for (let wx = x + 8; wx < x + w - 14; wx += 18) {
      wins += `<rect class="win" data-i="${idx++}" x="${wx}" y="${wy}" width="9" height="12" rx="1.5"/>`;
    }
  }
  const stars = Array.from({ length: 36 }, (_, i) => `<circle class="star" cx="${rnd(i + 1) * 1200}" cy="${rnd(i + 50) * 180}" r="${1 + rnd(i + 9) * 1.6}" fill="#fff" style="animation-delay:${(i % 7) * 0.4}s"/>`).join("");
  return `<svg class="scene city" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" data-wins="${idx}">
    <rect width="1200" height="560" fill="url(#gDusk)"/>${stars}
    <rect class="dawn" width="1200" height="560" fill="url(#gDawn)" opacity="0"/>
    <circle cx="150" cy="90" r="34" fill="url(#gMoon)"/>
    ${towers}${wins}
    <rect y="470" width="1200" height="90" fill="#0F172A"/><rect y="500" width="1200" height="8" fill="#334155"/>
    <path d="M0 530 H1200" stroke="#FDE047" stroke-width="3" stroke-dasharray="26 22" opacity=".7"/>
    <g transform="translate(220 470)"><rect x="-46" y="-170" width="92" height="170" rx="8" fill="#334155"/><rect x="-36" y="-150" width="72" height="44" rx="4" fill="#0B1020" stroke="#22D3EE" stroke-width="2"/><path class="glitch" d="M-28 -120 L-14 -136 L0 -118 L14 -140 L28 -124" stroke="#F43F5E" stroke-width="3" fill="none"/><circle class="blink-red" cx="0" cy="-184" r="8" fill="#F43F5E"/><line y1="-176" y2="-170" stroke="#94A3B8" stroke-width="4"/><rect x="-14" y="-40" width="28" height="40" fill="#1E293B"/></g>
    <g transform="translate(980 470)"><rect x="-70" y="-96" width="140" height="96" rx="6" fill="#475569"/><rect x="-44" y="-150" width="22" height="60" fill="#334155"/><circle class="smoke" cx="-33" cy="-160" r="10" fill="#94A3B8" opacity=".6"/><g stroke="#FACC15" stroke-width="4" fill="none"><path d="M0 -150 V-96 M-30 -130 H30 M-20 -110 H20"/></g><path class="spark" d="M30 -70 l-8 18 h10 l-8 20 20 -26 h-10 l8 -12z" fill="#FACC15"/><rect x="-50" y="-40" width="36" height="40" fill="#1E293B"/></g>
    <g transform="translate(600 480)"><ellipse rx="90" ry="14" fill="#1E293B"/><path d="M0 -10 V-40 M-18 -8 Q0 -60 18 -8" stroke="#38BDF8" stroke-width="4" fill="none" opacity=".8"/><circle cx="-60" cy="-8" r="7" fill="#FDBA74"/><circle cx="-40" cy="-10" r="7" fill="#FBCFE8"/><circle cx="46" cy="-9" r="7" fill="#FDE68A"/><circle cx="66" cy="-7" r="7" fill="#A78BFA"/></g>
    <g class="traffic" transform="translate(420 410)"><rect x="-6" width="12" height="60" fill="#475569"/><rect x="-14" y="-40" width="28" height="44" rx="6" fill="#0F172A"/><circle class="tl r" cy="-28" r="6"/><circle class="tl y" cy="-14" r="6"/><circle class="tl g" cy="0" r="6"/></g>
    <g class="traffic t2" transform="translate(790 410)"><rect x="-6" width="12" height="60" fill="#475569"/><rect x="-14" y="-40" width="28" height="44" rx="6" fill="#0F172A"/><circle class="tl r" cy="-28" r="6"/><circle class="tl y" cy="-14" r="6"/><circle class="tl g" cy="0" r="6"/></g>
  </svg>`;
}

export function setCityLight(svgEl, pct) {
  const total = Number(svgEl.dataset.wins) || 0;
  const n = Math.round((total * Math.max(0, Math.min(100, pct))) / 100);
  svgEl.querySelectorAll(".win").forEach((w, i) => w.classList.toggle("on", ((i * 37) % total) < n));
  svgEl.classList.toggle("restored", pct >= 100);
}

// ---------------------------------------------------------------- مرحله ۳: کارگاه
export function workshopBg() {
  return `<svg class="scene workshop-bg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="700" fill="url(#gWall)"/>
    <rect y="500" width="1200" height="200" fill="url(#gFloor)"/>
    <g opacity=".5" stroke="#451A03" stroke-width="3">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 110} 500 V700"/>`).join("")}</g>
    <rect x="70" y="70" width="230" height="170" rx="10" fill="#FDE68A" opacity=".9"/><path d="M185 70 V240 M70 155 H300" stroke="#92400E" stroke-width="8"/>
    <rect x="70" y="70" width="230" height="170" rx="10" fill="none" stroke="#92400E" stroke-width="10"/>
    <g transform="translate(900 90)"><rect width="240" height="150" rx="8" fill="#92400E"/><g fill="#1E293B"><circle cx="30" cy="30" r="8"/><circle cx="70" cy="30" r="8"/><circle cx="110" cy="30" r="8"/></g><path d="M20 70 h90 M30 100 h150" stroke="#FDBA74" stroke-width="6" stroke-linecap="round"/><g transform="translate(180 40)">${gear(22, 9, "#FCD34D")}</g></g>
    <g transform="translate(560 60)"><path d="M0 0 H120 L110 40 H10Z" fill="#FACC15"/><line x1="60" y1="-40" x2="60" y2="0" stroke="#78350F" stroke-width="4"/><ellipse cx="60" cy="70" rx="60" ry="30" fill="#FDE047" opacity=".18"/></g>
    <rect x="0" y="470" width="1200" height="40" fill="#78350F"/>
  </svg>`;
}

// ---------------------------------------------------------------- مرحله ۴: سرزمین آینده
export const WORLD_POS = { code: [230, 230], design: [600, 190], data: [970, 230], make: [230, 520], teach: [600, 540], biz: [970, 520] };

const WORLD_ART = {
  code: () => `<rect x="-52" y="-62" width="104" height="66" rx="8" fill="#0F172A" stroke="#6366F1" stroke-width="5"/><text x="0" y="-18" text-anchor="middle" font-size="34" font-family="monospace" fill="#34D399" direction="ltr">{ }</text><rect x="-66" y="6" width="132" height="12" rx="6" fill="#94A3B8"/>`,
  design: () => `<path d="M0 -70 C-46 -70 -70 -42 -70 -14 C-70 14 -44 30 -18 30 C-4 30 -4 14 -12 6 C-18 -2 -10 -12 4 -12 H26 C48 -12 66 -28 66 -44 C66 -62 36 -70 0 -70Z" fill="#FDE68A" stroke="#B45309" stroke-width="3"/><circle cx="-34" cy="-34" r="9" fill="#FB7185"/><circle cx="-10" cy="-50" r="9" fill="#38BDF8"/><circle cx="20" cy="-48" r="9" fill="#34D399"/><circle cx="44" cy="-30" r="9" fill="#A78BFA"/>`,
  data: () => `<rect x="-56" y="-26" width="22" height="30" fill="#38BDF8"/><rect x="-26" y="-56" width="22" height="60" fill="#34D399"/><rect x="4" y="-40" width="22" height="44" fill="#FACC15"/><rect x="34" y="-66" width="22" height="70" fill="#F97316"/><circle cx="-20" cy="-70" r="20" fill="none" stroke="#fff" stroke-width="6"/><path d="M-6 -56 L8 -42" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
  make: () => `<g transform="translate(-14 -30)"><g class="spin">${gear(30, 10, "#FACC15")}</g></g><g transform="translate(42 -18)"><g class="spin rev">${gear(18, 8, "#94A3B8")}</g></g>`,
  teach: () => `<path d="M-60 -10 V-62 Q-30 -76 0 -62 Q30 -76 60 -62 V-10 Q30 -24 0 -10 Q-30 -24 -60 -10Z" fill="#F8FAFC" stroke="#64748B" stroke-width="3"/><path d="M0 -62 V-10" stroke="#64748B" stroke-width="3"/><path d="M-44 -48 h28 M-44 -36 h22 M16 -48 h28 M16 -36 h22" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/><g transform="translate(46 -86)"><rect x="-26" y="-18" width="52" height="30" rx="14" fill="#F97316"/><path d="M-8 12 l-4 12 14 -12z" fill="#F97316"/><circle cx="-10" cy="-3" r="3" fill="#fff"/><circle cx="0" cy="-3" r="3" fill="#fff"/><circle cx="10" cy="-3" r="3" fill="#fff"/></g>`,
  biz: () => `<rect x="-58" y="-54" width="116" height="62" rx="10" fill="#B45309"/><path d="M-22 -54 V-66 Q-22 -74 -14 -74 H14 Q22 -74 22 -66 V-54" stroke="#78350F" stroke-width="7" fill="none"/><rect x="-58" y="-26" width="116" height="8" fill="#78350F"/><rect x="-10" y="-32" width="20" height="20" rx="4" fill="#FACC15"/><g transform="translate(46 -80)"><line y2="-30" stroke="#94A3B8" stroke-width="4"/><path d="M0 -30 H26 L18 -22 L26 -14 H0Z" fill="#F97316"/></g>`,
};

export function futureScene(titles) {
  const stars = Array.from({ length: 70 }, (_, i) => `<circle class="star" cx="${(i * 173) % 1200}" cy="${(i * 97) % 520}" r="${1 + (i % 3) * 0.6}" fill="#fff" style="animation-delay:${(i % 9) * 0.35}s"/>`).join("");
  const islands = Object.entries(WORLD_POS).map(([id, [x, y]], i) => `
    <g class="world" data-world="${id}" tabindex="0" role="button" aria-label="${titles[id] || id}" transform="translate(${x} ${y})">
      <g class="world-bob" style="animation-delay:${i * 0.45}s">
        <ellipse cx="0" cy="62" rx="108" ry="26" fill="#000" opacity=".2"/>
        <path d="M-104 28 Q-90 100 0 118 Q90 100 104 28Z" fill="url(#gRock)"/>
        <ellipse cx="0" cy="28" rx="106" ry="30" fill="url(#gGrass)"/>
        <g transform="translate(0 20)" class="world-art">${WORLD_ART[id]()}</g>
        <g transform="translate(0 134)"><rect x="-96" y="-17" width="192" height="30" rx="15" fill="#0F172A" opacity=".85"/><text x="0" y="4" text-anchor="middle" font-size="16" fill="#fff" class="sign-text">${titles[id] || id}</text></g>
        <g class="world-rank" transform="translate(-86 -58)"></g>
      </g>
    </g>`).join("");
  return `<svg class="scene future" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="720" fill="url(#gFuture)"/>${stars}
    <circle cx="1040" cy="90" r="56" fill="url(#gMoon)"/>
    <path d="M0 700 Q300 640 600 690 T1200 670 V720 H0Z" fill="#7C2D12" opacity=".6"/>
    ${islands}</svg>`;
}

export function welcomeScene() {
  return islandScene({ lab: "", tech: "", studio: "", workshop: "", command: "", hub: "" }).replace('class="scene island"', 'class="scene island island--welcome"');
}

// ابزارهای رابط کاربری: ساخت DOM، انیمیشن‌ها، کشیدن و رها کردن (Pointer Events)
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const fa = (n) => Number(n).toLocaleString("fa-IR");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const now = () => performance.now();

export function toast(msg, kind = "info") {
  const t = h("div", { class: `toast toast--${kind}`, role: "status" }, msg);
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3200);
}

export function floatPoints(anchor, text, kind = "pts") {
  const r = anchor.getBoundingClientRect();
  const f = h("div", { class: `float-pts float-pts--${kind}` }, text);
  f.style.left = r.left + r.width / 2 + "px";
  f.style.top = r.top + "px";
  document.body.append(f);
  setTimeout(() => f.remove(), 1400);
}

const COLORS = ["#F97316", "#FACC15", "#38BDF8", "#34D399", "#F472B6", "#A78BFA"];
export function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 36) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < n; i++) {
    const p = h("i", { class: "confetti" });
    const ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 180;
    p.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[i % COLORS.length]};--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist - 60}px;--r:${Math.random() * 720}deg`;
    document.body.append(p);
    setTimeout(() => p.remove(), 1300);
  }
}

export function animateNumber(el, from, to, ms = 700) {
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = fa(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// کشیدن و رها کردن با Pointer Events (موس و لمس). اگر جابه‌جایی کم بود «کلیک» حساب می‌شود.
export function draggable(el, { target, onDrop, onClick, onStart }) {
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    const sx = e.clientX, sy = e.clientY;
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left, oy = e.clientY - rect.top;
    let ghost = null, moved = false, hot = null;
    const under = (ev) => document.elementsFromPoint(ev.clientX, ev.clientY).map((n) => n.closest && n.closest(target)).find(Boolean) || null;
    const move = (ev) => {
      if (!moved) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 7) return;
        moved = true;
        ghost = el.cloneNode(true);
        ghost.classList.add("drag-ghost");
        ghost.style.width = rect.width + "px";
        ghost.style.height = rect.height + "px";
        document.body.append(ghost);
        el.classList.add("is-dragging");
        onStart && onStart();
      }
      ghost.style.transform = `translate(${ev.clientX - ox}px, ${ev.clientY - oy}px) scale(1.06)`;
      const t = under(ev);
      if (t !== hot) { hot && hot.classList.remove("drop-hover"); hot = t; hot && hot.classList.add("drop-hover"); }
    };
    const end = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      hot && hot.classList.remove("drop-hover");
      ghost && ghost.remove();
      el.classList.remove("is-dragging");
      if (!moved) { onClick && onClick(ev); return; }
      onDrop && onDrop(under(ev), ev);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  });
}

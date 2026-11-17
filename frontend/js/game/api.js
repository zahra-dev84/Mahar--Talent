// ارتباط با بک‌اند بازی. توکن ورود در localStorage («authToken») نگه‌داری می‌شود؛
// داده‌های بازی فقط در دیتابیس سرور ذخیره می‌شوند.
export const API_BASE = window.GAME_API_BASE || "http://127.0.0.1:5000";

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export const getToken = () => localStorage.getItem("authToken");

export function goLogin() {
  const next = encodeURIComponent("game.html" + location.search);
  location.href = `login.html?next=${next}`;
}

export async function request(method, path, body) {
  const token = getToken();
  if (!token) { goLogin(); throw new ApiError("وارد نشده‌ای", 401); }
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("ارتباط با سرور برقرار نشد. مطمئن شو بک‌اند روشن است.", 0);
  }
  let data = null;
  try { data = await res.json(); } catch { /* پاسخ بدون بدنه */ }
  if (res.status === 401) { localStorage.removeItem("authToken"); goLogin(); }
  if (!res.ok) throw new ApiError((data && data.message) || "خطای ناشناخته", res.status);
  return data;
}

export const api = {
  content: () => request("GET", "/game/content"),
  me: () => request("GET", "/game/me"),
  runs: () => request("GET", "/game/runs"),
  createRun: () => request("POST", "/game/runs"),
  runState: (id) => request("GET", `/game/runs/${id}`),
  resume: (id) => request("POST", `/game/runs/${id}/resume`),
  startStage: (id, n) => request("POST", `/game/runs/${id}/stages/${n}/start`),
  completeStage: (id, n, payload) => request("POST", `/game/runs/${id}/stages/${n}/complete`, payload || {}),
  attempt: (id, body) => request("POST", `/game/runs/${id}/stage3/attempt`, body),
  choice: (id, body) => request("POST", `/game/runs/${id}/choice`, body),
  report: (id) => request("GET", `/game/runs/${id}/report`),
};

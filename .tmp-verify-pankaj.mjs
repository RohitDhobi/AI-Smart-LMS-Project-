import { spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SECRET = "AI-Smart-LMS-Super-Secret-Key-2026-Change-This";
const EMAIL = "pankaj@gmail.com";
const PORT = 9333;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// --- 1. mint JWT (HS256, same as backend JwtService) ---
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const header = b64({ alg: "HS256", typ: "JWT" });
const payload = b64({ sub: EMAIL, iat: now, exp: now + 86400 });
const sig = createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
const token = `${header}.${payload}.${sig}`;

// --- 2. fetch profile (verifies token + gives stored user shape) ---
const res = await fetch("http://localhost:8080/api/profile", { headers: { Authorization: `Bearer ${token}` } });
const user = await res.json();
if (!res.ok || !user || user.error) {
  console.log("PROFILE FAIL", res.status, JSON.stringify(user).slice(0, 300));
  process.exit(1);
}
console.log("profile ok:", user.email, user.role, "course:", user.courseName || user.course || "");

// --- 3. drive Chrome over CDP ---
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1440,2200", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try {
    const v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
    wsUrl = v.webSocketDebuggerUrl;
  } catch { await sleep(250); }
}
if (!wsUrl) { console.log("CDP unavailable"); chrome.kill(); process.exit(1); }

const browserWs = new WebSocket(wsUrl);
await new Promise((r, j) => { browserWs.onopen = r; browserWs.onerror = j; });
let id = 0;
const pending = new Map();
const events = [];
browserWs.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg);
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => { const i = ++id; pending.set(i, resolve); browserWs.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });

const { result: { result: { targetId } } } = await send("Target.createTarget", { url: "about:blank" });
const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
await send("Page.enable", {}, sessionId);
await send("Runtime.enable", {}, sessionId);
await send("Network.enable", {}, sessionId);

const seed = `try {
  localStorage.setItem("token", ${JSON.stringify(token)});
  localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
} catch (e) {}`;
await send("Page.addScriptToEvaluateOnNewDocument", { source: seed }, sessionId);
await send("Page.navigate", { url: "http://localhost:5173/courses" }, sessionId);
await sleep(9000);

const ev = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sessionId);
  return r.result?.result?.value;
};
console.log("URL:", await ev("location.href"));
console.log("TITLE:", await ev("document.title"));
console.log("--- ENROLLED SECTION ---");
console.log(await ev(`(document.querySelector(".courses-enrolled-section")||{}).innerText || "NOT RENDERED"`));
console.log("--- HEADING ---");
console.log(await ev(`(document.querySelector(".courses-heading-row")||{}).innerText || "no heading row"`));
console.log("--- COUNTS ---");
console.log(await ev(`JSON.stringify({
  enrolledCards: document.querySelectorAll(".courses-enrolled-section .course-card").length,
  browseCards: document.querySelectorAll(".courses-grid > *").length,
  emptyMsgs: [...document.querySelectorAll(".empty")].map(e => e.innerText),
})`));
const apiErrs = events.filter((e) => e.method === "Network.responseReceived" &&
  String(e.params?.response?.url || "").includes("/api/") && e.params.response.status >= 400)
  .map((e) => `${e.params.response.status} ${e.params.response.url}`);
console.log("API ERRORS:", apiErrs.length ? apiErrs : "none");

chrome.kill();
fs.rmSync(userDataDir, { recursive: true, force: true });
process.exit(0);

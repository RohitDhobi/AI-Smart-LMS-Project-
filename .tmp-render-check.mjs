import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SECRET = "AI-Smart-LMS-Super-Secret-Key-2026-Change-This";
const EMAIL = "student@example.com";
const PORT = 9555;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const h = b64({ alg: "HS256", typ: "JWT" });
const p = b64({ sub: EMAIL, iat: now, exp: now + 86400 });
const sig = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
const token = `${h}.${p}.${sig}`;

const user = await (await fetch("http://localhost:8080/api/profile", { headers: { Authorization: `Bearer ${token}` } })).json();

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1440,2000", "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; } catch { await sleep(250); }
}
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const events = [];
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else if (msg.method) events.push(msg); };
const send = (method, params = {}, sid) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params, ...(sid ? { sessionId: sid } : {}) })); });

const t1 = await send("Target.createTarget", { url: "about:blank" });
const t2 = await send("Target.attachToTarget", { targetId: t1.result.targetId, flatten: true });
const sid = t2.result.sessionId;
await send("Page.enable", {}, sid); await send("Runtime.enable", {}, sid); await send("Network.enable", {}, sid);
await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem("token",${JSON.stringify(token)});localStorage.setItem("user",${JSON.stringify(JSON.stringify(user))});}catch(e){}` }, sid);
await send("Page.navigate", { url: "http://localhost:5173/courses" }, sid);
await sleep(9000);

const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true }, sid)).result?.result?.value;
console.log("URL:", await ev("location.href"));
console.log("BODY chars:", await ev("document.body.innerText.length"));
console.log("CSS applied (hero bg):", await ev("getComputedStyle(document.querySelector('.analytics-hero')||document.body).backgroundImage.slice(0,40)"));
console.log("Enrolled section:", await ev("(document.querySelector('.courses-enrolled-section')||{}).innerText?.split('\\n').slice(0,3).join(' / ') || 'MISSING'"));
console.log("Sidebar Divisions:", await ev("!![...document.querySelectorAll('a,li,div')].find(e=>e.textContent.trim()==='Divisions')"));
console.log("JS errors:", await ev("window.__errs ? window.__errs.length : 'n/a'"));
console.log("Failed API/asset:", events.filter((e) => e.method === "Network.responseReceived" && e.params.response.status >= 400).map((e) => `${e.params.response.status} ${e.params.response.url}`).slice(0, 5));

chrome.kill();
setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} process.exit(0); }, 1500);

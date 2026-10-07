import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SECRET = "AI-Smart-LMS-Super-Secret-Key-2026-Change-This";
const EMAIL = process.argv[2];
const PORT = 9444 + (EMAIL.length % 7);
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const header = b64({ alg: "HS256", typ: "JWT" });
const payload = b64({ sub: EMAIL, iat: now, exp: now + 86400 });
const sig = createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
const token = `${header}.${payload}.${sig}`;

const res = await fetch("http://localhost:8080/api/profile", { headers: { Authorization: `Bearer ${token}` } });
const user = await res.json();
if (!res.ok || !user || user.error) { console.log("PROFILE FAIL", res.status, JSON.stringify(user).slice(0, 200)); process.exit(1); }

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDataDir}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1440,2400", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl = null;
for (let i = 0; i < 40 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; }
  catch { await sleep(250); }
}
if (!wsUrl) { console.log("CDP unavailable"); chrome.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method) events.push(msg);
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });

const r1 = await send("Target.createTarget", { url: "about:blank" });
const r2 = await send("Target.attachToTarget", { targetId: r1.result.targetId, flatten: true });
const sid = r2.result.sessionId;
await send("Page.enable", {}, sid);
await send("Runtime.enable", {}, sid);
await send("Network.enable", {}, sid);
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `try{localStorage.setItem("token",${JSON.stringify(token)});localStorage.setItem("user",${JSON.stringify(JSON.stringify(user))});}catch(e){}`,
}, sid);
await send("Page.navigate", { url: "http://localhost:5173/divisions" }, sid);
await sleep(8000);

const ev = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true }, sid)).result?.result?.value;

console.log("=== " + EMAIL + " ===");
console.log("URL:", await ev("location.href"));
console.log("--- PAGE ---");
console.log(await ev(`(document.querySelector(".divisions-page")||{}).innerText || "PAGE NOT RENDERED"`));
console.log("--- SIDEBAR 'Divisions' link:", await ev(`!![...document.querySelectorAll("a,button,li,div")].find(e=>e.textContent.trim()==="Divisions")`));
console.log("--- API ERRORS:",
  events.filter((e) => e.method === "Network.responseReceived" &&
    String(e.params?.response?.url || "").includes("/api/") && e.params.response.status >= 400)
    .map((e) => `${e.params.response.status} ${e.params.response.url}`));

chrome.kill();
setTimeout(() => { try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {} process.exit(0); }, 1500);

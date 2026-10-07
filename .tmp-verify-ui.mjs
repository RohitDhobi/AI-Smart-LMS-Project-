// Temporary UI verification (deleted after the check).
// Usage: node .tmp-verify-ui.mjs <email> <password> <label>
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const API = "http://localhost:8080/api";
const APP_URL = "http://localhost:5173/courses";
const DEBUG_PORT = 9433;
const [, , email, password, label = "check"] = process.argv;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function login() {
  const { status, data } = await post("/auth/login", { email, password });
  if (status === 200 && data?.token) return data;
  // first run for a throwaway account -> create it through the normal flow
  const reg = await post("/auth/register", {
    name: "Enrolled Verify",
    email,
    password,
    courseId: 1,
  });
  console.log("register:", reg.status, JSON.stringify(reg.data).slice(0, 200));
  const again = await post("/auth/login", { email, password });
  if (!again.data?.token) throw new Error("login failed: " + JSON.stringify(again.data));
  return again.data;
}

const session = await login();
console.log("logged in as", session.user?.name, "| role:", session.user?.role);

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${process.env.TEMP}\\chrome-cdp-${label}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

let wsUrl = null;
for (let i = 0; i < 40 && !wsUrl; i++) {
  await sleep(250);
  try {
    const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) wsUrl = page.webSocketDebuggerUrl;
  } catch {
    /* not up yet */
  }
}
if (!wsUrl) {
  chrome.kill();
  throw new Error("CDP endpoint never came up");
}

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let nextId = 1;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evalJs(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value;
}

await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `try {
    localStorage.setItem("token", ${JSON.stringify(session.token)});
    localStorage.setItem("user", ${JSON.stringify(JSON.stringify(session.user))});
  } catch (e) {}`,
});
await send("Page.navigate", { url: APP_URL });

let text = null;
for (let i = 0; i < 60 && !text; i++) {
  await sleep(500);
  text = await evalJs(`(() => {
    const s = document.querySelector(".courses-enrolled-section");
    if (s) return s.innerText;
    const e = document.querySelector(".error");
    return e ? "ERROR: " + e.innerText : null;
  })()`);
}

const report = await evalJs(`(() => ({
  url: location.pathname,
  enrolledSection: document.querySelector(".courses-enrolled-section")?.innerText || null,
  enrolledCards: document.querySelectorAll(".courses-enrolled-section .course-card").length,
  browseCards: document.querySelectorAll(".courses-grid").length
    ? [...document.querySelectorAll(".courses-grid")].pop().querySelectorAll(".course-card").length
    : 0,
  headings: [...document.querySelectorAll(".courses-heading-row")].map(h => h.innerText.replace(/\\n+/g, " | ")),
  browseEmpty: [...document.querySelectorAll(".empty")].map(e => e.innerText),
  chips: [...document.querySelectorAll(".course-enrolled-chip")].map(c => c.innerText),
  footers: [...document.querySelectorAll(".courses-enrolled-section .course-view")].map(c => c.innerText),
}))()`);

const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(`${label}-courses.png`, Buffer.from(shot.data, "base64"));

console.log(JSON.stringify(report, null, 2));

ws.close();
chrome.kill();
process.exit(0);

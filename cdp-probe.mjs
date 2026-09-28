// Temporary diagnostic: full round-trip of the exam schedule slot.
import { spawn } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const PROFILE = "C:\\Temp\\cdp-probe-profile4";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  "--no-first-run", "--no-default-browser-check", "--window-size=1400,1000", "about:blank",
]);

let page;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    page = list.find((t) => t.type === "page");
    if (page) break;
  } catch {}
  await sleep(250);
}
if (!page) { console.log("NO_PAGE_TARGET"); chrome.kill(); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r));

const send = (method, params = {}) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
};
async function evaljs(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.text };
  return r.result?.result?.value;
}

async function keyEvents(ch) {
  const digit = /\d/.test(ch);
  const base = digit
    ? { key: ch, code: "Digit" + ch, windowsVirtualKeyCode: ch.charCodeAt(0) }
    : { key: ch.toUpperCase(), code: "Key" + ch.toUpperCase(), windowsVirtualKeyCode: ch.toUpperCase().charCodeAt(0) };
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...base, text: ch, unmodifiedText: ch });
  await send("Input.dispatchKeyEvent", { type: "char", ...base, text: ch, unmodifiedText: ch });
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}

async function typeInto(selector, text) {
  const info = await evaljs(`(() => {
      const i = document.querySelector(${JSON.stringify(selector)});
      if (!i) return null;
      i.focus();
      const r = i.getBoundingClientRect();
      return { x: r.x + 10, y: r.y + r.height / 2 };
    })()`);
  if (!info) return "no element";
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: info.x, y: info.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: info.x, y: info.y, button: "left", clickCount: 1 });
  for (const ch of text) { await keyEvents(ch); await sleep(35); }
  await sleep(250);
  return evaljs(`document.querySelector(${JSON.stringify(selector)})?.value ?? null`);
}

async function apiLogin() {
  const r = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
  });
  return (await r.json()).token;
}

await send("Page.enable");
await send("Runtime.enable");

const token = await apiLogin();
await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);
await evaljs(`localStorage.setItem("token", ${JSON.stringify(token)});
  localStorage.setItem("user", JSON.stringify({id:11,name:"Admin User",email:"admin@example.com",role:"HOD"}));`);

// ---- 1. Set the slot on the HOD exam page ------------------------------
await send("Page.navigate", { url: "http://localhost:5173/hod/exams/9" });
await sleep(4000);

console.log("open day  :", await typeInto("#exam-open-date", "05102026"));
console.log("open time :", await typeInto("#exam-open-time", "0930"));
console.log("close day  :", await typeInto("#exam-close-date", "05102026"));
console.log("close time :", await typeInto("#exam-close-time", "1200"));
await sleep(500);

console.log("hint:", await evaljs(
  `[...document.querySelectorAll("p.hod-sub")].map(p => p.textContent.trim()).filter(t => /Paper opens/i.test(t))[0]`
));

console.log("click save:", await evaljs(`(() => {
    const b = [...document.querySelectorAll("button")].find(b => /save/i.test(b.textContent));
    if (!b) return "no save button";
    if (b.disabled) return "DISABLED";
    b.click();
    return "clicked";
  })()`));
await sleep(3000);

console.log("after save:", await evaljs(`({
  openDate: document.querySelector("#exam-open-date")?.value,
  openTime: document.querySelector("#exam-open-time")?.value,
  closeDate: document.querySelector("#exam-close-date")?.value,
  closeTime: document.querySelector("#exam-close-time")?.value,
  notice: [...document.querySelectorAll(".notice")].map(n => n.textContent.trim())[0],
  saveDisabled: [...document.querySelectorAll("button")].filter(b => /save/i.test(b.textContent)).map(b => b.disabled)
})`));

const tok2 = await apiLogin();
const saved = await (await fetch("http://localhost:8080/api/exams/9", {
  headers: { Authorization: "Bearer " + tok2 },
})).json();
console.log("persisted:", { startTime: saved.startTime, endTime: saved.endTime, status: saved.status });

// ---- 2. Student view: paper must be locked until that slot -------------
await send("Page.navigate", { url: "http://localhost:5173/exams" });
await sleep(4000);
console.log("student cards:", await evaljs(
  `JSON.stringify([...document.querySelectorAll(".quiz-card")].map(c => ({
      title: c.querySelector("h2")?.textContent,
      badge: c.querySelector(".passed-badge")?.textContent.trim(),
      countdown: [...c.querySelectorAll("div")].map(d => d.textContent).find(t => /Opens in/.test(t)) || null,
      buttons: [...c.querySelectorAll("button")].map(b => b.textContent.trim())
    })))`
));

// ---- 3. Put the data back the way we found it --------------------------
await fetch("http://localhost:8080/api/exams/9", {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: "Bearer " + tok2 },
  body: JSON.stringify({ ...saved, startTime: null, endTime: null }),
});
const restored = await (await fetch("http://localhost:8080/api/exams/9", {
  headers: { Authorization: "Bearer " + tok2 },
})).json();
console.log("restored:", { startTime: restored.startTime, endTime: restored.endTime });

chrome.kill();
process.exit(0);

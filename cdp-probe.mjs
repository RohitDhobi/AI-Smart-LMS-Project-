// Temporary diagnostic: drives the HOD schedule fields in a real Chrome.
import { spawn } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const PROFILE = "C:\\Temp\\cdp-probe-profile2";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1400,1000",
  "about:blank",
]);

async function targets() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  return res.json();
}

let page;
for (let i = 0; i < 40; i++) {
  try {
    const list = await targets();
    page = list.find((t) => t.type === "page");
    if (page) break;
  } catch {}
  await sleep(250);
}
if (!page) {
  console.log("NO_PAGE_TARGET");
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
await new Promise((r) => ws.addEventListener("open", r));

const send = (method, params = {}) => {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
};
async function evaljs(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.text };
  return r.result?.result?.value;
}

await send("Page.enable");
await send("Runtime.enable");

const loginRes = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
});
const { token } = await loginRes.json();

await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);
await evaljs(
  `localStorage.setItem("token", ${JSON.stringify(token)});
   localStorage.setItem("user", JSON.stringify({id:11,name:"Admin User",email:"admin@example.com",role:"HOD"}));`
);

await send("Page.navigate", { url: "http://localhost:5173/hod/exams/9" });
await sleep(4000);

console.log("fields:", await evaljs(
  `JSON.stringify([...document.querySelectorAll("input[type=date],input[type=time],input[type=datetime-local]")]
      .map(i => ({ t: i.type, v: i.value, label: i.getAttribute("aria-label") || i.id })))`
));

// Simulate a human picking a day and a time: set the value and fire the
// native events the browser would send.
console.log("set:", await evaljs(`(() => {
    const d = document.querySelector("#exam-open-date");
    const t = document.querySelector("#exam-open-time");
    if (!d || !t) return "missing fields";
    d.value = "2026-10-05";
    d.dispatchEvent(new Event("input", { bubbles: true }));
    d.dispatchEvent(new Event("change", { bubbles: true }));
    t.value = "09:30";
    t.dispatchEvent(new Event("input", { bubbles: true }));
    t.dispatchEvent(new Event("change", { bubbles: true }));
    return { date: d.value, time: t.value };
  })()`));
await sleep(700);

console.log("values after react:", await evaljs(
  `JSON.stringify({
      date: document.querySelector("#exam-open-date")?.value,
      time: document.querySelector("#exam-open-time")?.value,
      hint: [...document.querySelectorAll("p.hod-sub")].map(p => p.textContent).filter(t => /opens/i.test(t))[0]
    })`
));

console.log("save:", await evaljs(
  `[...document.querySelectorAll("button")].filter(b=>/save/i.test(b.textContent))
      .map(b=>({ t: b.textContent.trim(), disabled: b.disabled }))`
));

// If Save is enabled, click it and confirm the backend persisted the slot.
console.log("clicked:", await evaljs(`(() => {
    const b = [...document.querySelectorAll("button")].find(b => /save/i.test(b.textContent));
    if (!b || b.disabled) return "not clickable";
    b.click();
    return "clicked";
  })()`));
await sleep(2500);

const login2 = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
});
const { token: token2 } = await login2.json();
const examRes = await fetch("http://localhost:8080/api/exams/9", {
  headers: { Authorization: "Bearer " + token2 },
});
const exam = await examRes.json();
console.log("persisted:", { startTime: exam.startTime, endTime: exam.endTime, status: exam.status });

console.log("notice:", await evaljs(
  `[...document.querySelectorAll(".notice")].map(n => n.textContent).slice(0, 2)`
));

// Leave the data exactly as we found it.
await fetch("http://localhost:8080/api/exams/9", {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: "Bearer " + token2 },
  body: JSON.stringify({ ...exam, startTime: null, endTime: null }),
});
const after = await (await fetch("http://localhost:8080/api/exams/9", {
  headers: { Authorization: "Bearer " + token2 },
})).json();
console.log("restored:", { startTime: after.startTime, endTime: after.endTime });

chrome.kill();
process.exit(0);

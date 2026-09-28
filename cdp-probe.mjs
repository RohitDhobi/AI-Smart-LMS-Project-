// Temporary diagnostic: types real keystrokes into the React app in Chrome.
import { spawn } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const PROFILE = "C:\\Temp\\cdp-probe-profile3";

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

await send("Page.enable");
await send("Runtime.enable");

const { token } = await (await fetch("http://localhost:8080/api/auth/login", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
})).json();

await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);
await evaljs(`localStorage.setItem("token", ${JSON.stringify(token)});
  localStorage.setItem("user", JSON.stringify({id:11,name:"Admin User",email:"admin@example.com",role:"HOD"}));`);

// --- A) Do trusted keystrokes reach React state at all? --------------------
await send("Page.navigate", { url: "http://localhost:5173/exams" });
await sleep(4000);
console.log("cards before:", await evaljs(`document.querySelectorAll(".quiz-card").length`));
await typeInto(".dash-search input", "mid");
await sleep(600);
console.log("after typing 'mid' in the search box:", await evaljs(`({
  value: document.querySelector(".dash-search input")?.value,
  cards: document.querySelectorAll(".quiz-card").length
})`));

// --- B) The schedule fields ------------------------------------------------
await send("Page.navigate", { url: "http://localhost:5173/hod/exams/9" });
await sleep(4000);
console.log("fields:", await evaljs(
  `JSON.stringify([...document.querySelectorAll("input[type=date],input[type=time]")]
     .map(i => ({ t: i.type, id: i.id, v: i.value })))`
));

console.log("type day:", await typeInto("#exam-open-date", "05102026"));
console.log("type time:", await typeInto("#exam-open-time", "0930"));
await sleep(700);
console.log("state:", await evaljs(`({
  date: document.querySelector("#exam-open-date")?.value,
  time: document.querySelector("#exam-open-time")?.value,
  hint: [...document.querySelectorAll("p.hod-sub")].map(p => p.textContent.trim()).filter(t => /Paper opens/i.test(t))[0],
  save: [...document.querySelectorAll("button")].filter(b => /save/i.test(b.textContent)).map(b => b.disabled)
})`));

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
  for (const ch of text) { await keyEvents(ch); await sleep(40); }
  await sleep(300);
  return await evaljs(`(() => {
      const i = document.querySelector(${JSON.stringify(selector)});
      return i ? i.value : null;
    })()`);
}

chrome.kill();
process.exit(0);

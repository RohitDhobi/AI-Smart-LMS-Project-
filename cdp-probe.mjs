// Temporary diagnostic: the create-exam form's schedule fields.
import { spawn } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9334;
const PROFILE = "C:\\Temp\\cdp-probe-profile5";
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

await send("Page.navigate", { url: "http://localhost:5173/hod/exams/new" });
await sleep(4000);
console.log("page:", await evaljs(`({
  path: location.pathname,
  crash: document.body.innerText.includes("Something went wrong") ? document.body.innerText.slice(0, 200) : null,
  fields: [...document.querySelectorAll("input[type=date],input[type=time]")].map(i => i.id),
  selects: [...document.querySelectorAll("select")].length
})`));
console.log("typed open:", await typeInto("#create-open-date", "20112026"), await typeInto("#create-open-time", "1000"));
console.log("typed close:", await typeInto("#create-close-date", "20112026"), await typeInto("#create-close-time", "1300"));
console.log("hints:", await evaljs(
  `[...document.querySelectorAll("small")].map(s => s.textContent).filter(t => /blank/i.test(t))`
));

chrome.kill();
process.exit(0);

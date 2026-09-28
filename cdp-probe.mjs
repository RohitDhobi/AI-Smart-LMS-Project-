// Temporary diagnostic: types into the schedule inputs in a real Chrome.
import { spawn } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const PROFILE = "C:\\Temp\\cdp-probe-profile";

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

function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}
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

// Seed a token so the HOD exam page renders.
const loginRes = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
});
const { token } = await loginRes.json();

await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);
console.log(
  "seed:",
  await evaljs(
    `localStorage.setItem("token", ${JSON.stringify(token)});
     localStorage.setItem("user", JSON.stringify({id:11,name:"Admin User",email:"admin@example.com",role:"HOD"}));
     location.origin;`
  )
);

await send("Page.navigate", { url: "http://localhost:5173/hod/exams/9" });
await sleep(4000);

console.log(
  "page:",
  await evaljs(`location.pathname + " | inputs=" + document.querySelectorAll("input").length`)
);
console.log(
  "fields:",
  await evaljs(
    `JSON.stringify([...document.querySelectorAll("input[type=date],input[type=time],input[type=datetime-local]")].map(i => ({t:i.type, v:i.value, w:Math.round(i.getBoundingClientRect().width), h:Math.round(i.getBoundingClientRect().height)})))`
  )
);

// Does clicking focus the field?
console.log(
  "click-focus:",
  await evaljs(`(() => {
      const i = document.querySelector("input[type=datetime-local], input[type=date]");
      if (!i) return "no input";
      i.focus();
      return document.activeElement === i;
    })()`)
);

async function typeInto(selector, text) {
  const info = await evaljs(`(() => {
      const i = document.querySelector(${JSON.stringify(selector)});
      if (!i) return null;
      i.focus();
      const r = i.getBoundingClientRect();
      return { x: r.x + 8, y: r.y + r.height / 2 };
    })()`);
  if (!info) return "no element";
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: info.x, y: info.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: info.x, y: info.y, button: "left", clickCount: 1 });
  for (const ch of text) {
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", text: ch, key: ch, unmodifiedText: ch });
    await send("Input.dispatchKeyEvent", { type: "char", text: ch, key: ch, unmodifiedText: ch });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
    await sleep(30);
  }
  await sleep(300);
  return await evaljs(`(() => {
      const i = document.querySelector(${JSON.stringify(selector)});
      return i ? { value: i.value } : null;
    })()`);
}

console.log("type date:", await typeInto("input[type=datetime-local]", "28102026"));
console.log("type time:", await typeInto("input[type=datetime-local]:nth-of-type(1)", "1030"));
console.log(
  "after:",
  await evaljs(
    `JSON.stringify([...document.querySelectorAll("input[type=datetime-local]")].map(i=>i.value))`
  )
);
console.log(
  "save-disabled:",
  await evaljs(
    `[...document.querySelectorAll("button")].filter(b=>/save/i.test(b.textContent)).map(b=>({t:b.textContent.trim(),d:b.disabled}))`
  )
);

// --- control experiments -------------------------------------------------
// 1) Does the same keystroke synthesis work on a plain text input?
await evaljs(`(() => {
    const t = document.createElement("input");
    t.type = "text"; t.id = "__probe_text";
    t.style.cssText = "position:fixed;top:10px;left:10px;z-index:99999";
    document.body.appendChild(t);
    return true;
  })()`);
console.log("type text:", await typeInto("#__probe_text", "hello"));

// 3) Same keystrokes on NON-React date/time widgets: if these also stay
//    empty, my synthetic typing is at fault rather than React.
await evaljs(`(() => {
    for (const [id, type] of [["__probe_dt", "datetime-local"], ["__probe_date", "date"], ["__probe_time", "time"]]) {
      const el = document.createElement("input");
      el.type = type; el.id = id;
      el.style.cssText = "position:fixed;top:" + (60 + Math.random() * 40) + "px;left:10px;z-index:99999";
      document.body.appendChild(el);
    }
    return true;
  })()`);
console.log("plain datetime-local:", await typeInto("#__probe_dt", "28102026"));
console.log("plain date:", await typeInto("#__probe_date", "28102026"));
console.log("plain time:", await typeInto("#__probe_time", "1030"));

// 2) Does React keep a programmatic value (i.e. is React clobbering it)?
console.log(
  "programmatic set:",
  await evaljs(`(() => {
      const i = document.querySelector("input[type=datetime-local]");
      i.value = "2026-10-01T09:00";
      i.dispatchEvent(new Event("input", { bubbles: true }));
      i.dispatchEvent(new Event("change", { bubbles: true }));
      return { immediately: i.value };
    })()`)
);
await sleep(500);
console.log(
  "after react render:",
  await evaljs(`JSON.stringify([...document.querySelectorAll("input[type=datetime-local]")].map(i=>i.value))`)
);
console.log(
  "save-disabled after:",
  await evaljs(
    `[...document.querySelectorAll("button")].filter(b=>/save/i.test(b.textContent)).map(b=>({t:b.textContent.trim(),d:b.disabled}))`
  )
);

chrome.kill();
process.exit(0);

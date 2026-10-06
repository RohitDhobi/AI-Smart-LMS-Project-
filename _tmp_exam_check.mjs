// Temporary UI check: /hod/exams/12 - set Opens 06-10-2026 12:55 and Closes
// 06-10-2026 01:55 (an impossible slot), press Save, and verify the page now
// auto-moves the closing time to opening + 180 minutes instead of erroring.
const DEBUG = "http://127.0.0.1:9333";
const PAGE = "http://localhost:5173/hod/exams/12";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = await (await fetch(DEBUG + "/json/list")).json();
const page = list.find((t) => t.type === "page");
if (!page) throw new Error("no page target");

const ws = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let seq = 0;
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evalx = async (expression) => {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

const setField = (id, value) => `(function () {
  const el = document.getElementById(${JSON.stringify(id)});
  if (!el) return "NOT FOUND: ${id}";
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return el.value;
})()`;

const readState = `(() => ({
  openDate: document.getElementById("exam-open-date")?.value,
  openTime: document.getElementById("exam-open-time")?.value,
  closeDate: document.getElementById("exam-close-date")?.value,
  closeTime: document.getElementById("exam-close-time")?.value,
  error: document.querySelector(".error")?.textContent || null,
  notice: document.querySelector(".notice")?.textContent || null,
  inline: [...document.querySelectorAll("p")]
    .map((p) => p.textContent.trim())
    .find((t) => t.startsWith("⚠")) || null,
  preview: [...document.querySelectorAll(".hod-sub")]
    .map((p) => p.textContent.trim())
    .find((t) => t.startsWith("Paper opens")) || null,
  saveDisabled: [...document.querySelectorAll("button")]
    .filter((b) => b.textContent.trim().startsWith("Save"))
    .map((b) => b.disabled),
}))()`;

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);

const auth = await (await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
})).json();

await evalx(`localStorage.setItem("token", ${JSON.stringify(auth.token)});
localStorage.setItem("user", ${JSON.stringify(JSON.stringify(auth.user))}); "ok"`);

await send("Page.navigate", { url: PAGE });
await sleep(4000);

console.log("== loaded ==");
console.log(JSON.stringify(await evalx(readState), null, 2));

console.log("\n== typing the impossible slot (open 12:55, close 01:55 same day) ==");
console.log("open date :", await evalx(setField("exam-open-date", "2026-10-06")));
await sleep(300);
console.log("open time :", await evalx(setField("exam-open-time", "12:55")));
await sleep(300);
console.log("close date:", await evalx(setField("exam-close-date", "2026-10-06")));
await sleep(300);
console.log("close time:", await evalx(setField("exam-close-time", "01:55")));
await sleep(500);

const before = await evalx(readState);
console.log("inline warning:", JSON.stringify(before.inline));
console.log("preview       :", JSON.stringify(before.preview));
console.log("save disabled :", JSON.stringify(before.saveDisabled));

await evalx(`[...document.querySelectorAll("button")]
  .find((b) => b.textContent.trim().startsWith("Save")).click()`);
await sleep(3000);

const after = await evalx(readState);
console.log("\n== after Save ==");
console.log(JSON.stringify(after, null, 2));

ws.close();

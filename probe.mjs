// Temporary probe: logs into the running app, opens a URL and prints the
// computed background/text colour of key elements.
const DEBUG_PORT = 9333;
const PAGE_URL = process.argv[2] || "http://localhost:5173/hod/divisions/-1";
const THEME = process.argv[3] || "dark";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const loginRes = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
});
const login = await loginRes.json().catch(() => ({}));
const token = login.token || login.accessToken || login.jwt;
const user = login.user || login.data || { name: "Head of Department", email: "hod@example.com", role: "HOD" };

const targets = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json());
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception));
  return r.result.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);
await evaluate(
  `localStorage.setItem("token", ${JSON.stringify(token)});` +
    `localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});` +
    `localStorage.setItem("lms_theme", ${JSON.stringify(THEME)});` +
    `"ok"`
);
await send("Page.navigate", { url: PAGE_URL });
await sleep(6000);

const out = await evaluate(`(() => {
  const rows = [];
  const sels = [
    ".inst-modal-actions .inst-btn-secondary",
    ".inst-modal-actions .inst-btn-primary",
    ".error",
    ".card",
    "input.inst-input",
    "select.inst-select",
    ".page-heading h1",
    ".page-heading p",
    "label",
  ];
  for (const s of sels) {
    const el = document.querySelector(s);
    if (!el) { rows.push(s + " => MISSING"); continue; }
    const cs = getComputedStyle(el);
    rows.push(s + " => bg:" + cs.backgroundColor + "  color:" + cs.color + "  border:" + cs.borderColor + "  [" + el.textContent.trim().slice(0, 25) + "]");
  }
  rows.push("html data-theme=" + document.documentElement.getAttribute("data-theme"));
  rows.push("page bg=" + getComputedStyle(document.querySelector(".page")).backgroundColor);
  return rows.join("\\n");
})()`);
console.log(out);
ws.close();
process.exit(0);

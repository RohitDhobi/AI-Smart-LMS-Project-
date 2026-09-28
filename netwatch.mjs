// Temporary: watch which requests fail while an app page loads.
const DEBUG_PORT = 9333;
const PAGE_URL = process.argv[2] || "http://localhost:5173/hod/divisions";
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
const events = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else if (m.method) {
    events.push(m);
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
    `localStorage.setItem("lms_theme", "dark");"ok"`
);

events.length = 0;
await send("Network.enable");
await send("Page.navigate", { url: PAGE_URL });
await sleep(8000);

const byId = new Map();
for (const e of events) {
  if (e.method === "Network.responseReceived") {
    const r = e.params.response;
    byId.set(e.params.requestId, { url: r.url, status: r.status });
  }
}
console.log("--- HTTP >= 400 ---");
for (const [, v] of byId) if (v.status >= 400) console.log(" ", v.status, v.url);
console.log("--- loading failed ---");
for (const e of events) {
  if (e.method === "Network.loadingFailed") {
    const v = byId.get(e.params.requestId);
    console.log("  FAIL", e.params.errorText, v ? v.url : "(no response)", e.params.blockedReason || "");
  }
}
console.log("--- total requests:", byId.size);
ws.close();
process.exit(0);

// Temporary: print the Unassigned column of the Manage Students page.
const DEBUG_PORT = 9333;
const PAGE_URL = process.argv[2] || "http://localhost:5173/hod/divisions/1/students";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const login = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
}).then((r) => r.json());
const token = login.token || login.accessToken || login.jwt;
const user = login.user || login.data || { name: "Head of Department", email: "hod@example.com", role: "HOD" };

const targets = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json());
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
await new Promise((res) => ws.addEventListener("open", res));
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id; pending.set(i, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
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
await send("Page.navigate", { url: PAGE_URL });
await sleep(6000);

console.log(await evaluate(`(() => {
  const cols = document.querySelectorAll(".hod-division-columns .card");
  const out = [];
  cols.forEach((c) => {
    const head = c.querySelector("h3")?.textContent || "?";
    const count = c.querySelector(".hod-division-col-head .hod-sub")?.textContent || "";
    out.push(head + " -> " + count);
  });
  const rows = [...document.querySelectorAll(".hod-student-pick-list .hod-student-row")];
  out.push("rendered unassigned rows: " + rows.length);
  rows.slice(0, 4).forEach((r) => out.push("   " + r.innerText.replace(/\\n+/g, " | ")));
  out.push("badges 'no course': " + document.querySelectorAll(".hod-student-pick-list .status-badge").length);
  out.push("heading: " + (document.querySelector(".page-heading h1")?.textContent || ""));
  return out.join("\\n");
})()`));
ws.close();
process.exit(0);

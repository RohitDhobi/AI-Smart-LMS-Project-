// Temporary UI check: opens /hod/assignments in headless Chrome and types in
// the Instructor Assignment search box the same way a user would.
const DEBUG = "http://127.0.0.1:9333";
const PAGE = "http://localhost:5173/hod/assignments";
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

await send("Page.enable");
await send("Runtime.enable");

// 1. Land on the origin first so we can seed the session.
await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);

const tokenRes = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
});
const { token, user } = await tokenRes.json();

await evalx(`localStorage.setItem("token", ${JSON.stringify(token)});
localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
"ok"`);

// 2. Open the Instructor Assignment page.
await send("Page.navigate", { url: PAGE });
await sleep(4000);

const readState = `(() => {
  const counter = [...document.querySelectorAll(".hod-actions .hod-sub")]
    .map((e) => e.textContent.trim()).join(" ");
  const rows = [...document.querySelectorAll(".hod-table tbody tr")].map((tr) =>
    [...tr.querySelectorAll("td")].map((td) => td.innerText.trim())
  );
  const empty = document.querySelector(".hod-empty h3")?.textContent || null;
  return {
    url: location.pathname,
    heading: document.querySelector("h1")?.textContent || null,
    counter, empty, rowCount: rows.length,
    instructors: rows.map((r) => r[4]),
    subjects: rows.map((r) => r[0].split("\\n")[0]),
  };
})()`;

const typeInto = (value) => `(function () {
  const el = document.querySelector(".hod-filter-search");
  if (!el) return "INPUT NOT FOUND";
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return el.value;
})()`;

console.log("== page loaded ==");
console.log(JSON.stringify(await evalx(readState), null, 2));

for (const term of ["rajesh", "gupta", "suresh", "xyz"]) {
  await evalx(typeInto(term));
  await sleep(400);
  const s = await evalx(readState);
  console.log(`\n== search "${term}" ==`);
  console.log(JSON.stringify({
    counter: s.counter, rowCount: s.rowCount, empty: s.empty,
    instructors: [...new Set(s.instructors)].slice(0, 6),
    subjects: s.subjects.slice(0, 4),
  }, null, 2));
}

ws.close();

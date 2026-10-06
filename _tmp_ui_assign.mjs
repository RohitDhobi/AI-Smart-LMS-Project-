// Temporary UI check #2: run the "New Assignment" modal twice (another
// instructor, then back to Prof. Rajesh Kumar) and confirm the table + search
// always show whoever was assigned last.
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

const setSelect = (index, value) => `(function () {
  const el = [...document.querySelectorAll(".inst-modal select")][${index}];
  if (!el) return "SELECT ${index} NOT FOUND";
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(el, ${JSON.stringify(String(value))});
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return el.value;
})()`;

const typeInto = (value) => `(function () {
  const el = document.querySelector(".hod-filter-search");
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return el.value;
})()`;

const readState = `(() => {
  const rows = [...document.querySelectorAll(".hod-table tbody tr")].map((tr) =>
    [...tr.querySelectorAll("td")].map((td) => td.innerText.trim())
  );
  return {
    counter: [...document.querySelectorAll(".hod-actions .hod-sub")]
      .map((e) => e.textContent.trim()).join(" "),
    notice: document.querySelector(".notice")?.textContent || null,
    error: document.querySelector(".error")?.textContent || null,
    rowCount: rows.length,
    first: rows[0] ? { subject: rows[0][0], instructor: rows[0][4] } : null,
  };
})()`;

async function assign(instructorId, instructorLabel) {
  await evalx(typeInto(""));
  await sleep(300);
  await evalx(
    `[...document.querySelectorAll(".hod-actions button")].find((b) => b.textContent.includes("New Assignment")).click()`
  );
  await sleep(600);

  console.log(`\n>>> New Assignment -> ${instructorLabel}`);
  console.log("course   :", await evalx(setSelect(0, "6")));
  await sleep(400);
  console.log("semester :", await evalx(setSelect(1, "")));
  await sleep(300);
  console.log("year     :", await evalx(setSelect(2, "2")));
  await sleep(300);
  console.log("subject  :", await evalx(setSelect(3, "1")));
  await sleep(400);
  console.log("instructor:", await evalx(setSelect(4, String(instructorId))));
  await sleep(400);

  await evalx(
    `document.querySelector('.inst-modal button[type="submit"]').click()`
  );
  await sleep(2500);

  const state = await evalx(readState);
  console.log("result   :", JSON.stringify(state));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Page.navigate", { url: PAGE });
await sleep(4000);

console.log("== start ==");
console.log(JSON.stringify(await evalx(readState)));

await assign(28, "Prof. Ritu Agarwal");
await evalx(typeInto("ritu"));
await sleep(400);
console.log('search "ritu":', JSON.stringify(await evalx(readState)));

await assign(20, "Prof. Rajesh Kumar");
await evalx(typeInto("rajesh"));
await sleep(400);
console.log('search "rajesh":', JSON.stringify(await evalx(readState)));

await evalx(typeInto(""));
ws.close();

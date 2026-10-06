// Temp verification 3 - delete after use. Drives /hod/exams/12 and /hod/exams/new.
const DEBUG = "http://localhost:9333";
const TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJob2RAZXhhbXBsZS5jb20iLCJpYXQiOjE3OTEyOTIwNDAsImV4cCI6MTc5MTM3ODQ0MH0.4d-CcyLmOkJDk2X-h4_kWu4mFv3W-f1euuh0TfSFCPY";
const USER = JSON.stringify({
  id: 46, name: "Head of Department", email: "hod@example.com", role: "HOD",
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} :: ${detail ?? ""}`); }
}

async function main() {
  const list = await (await fetch(`${DEBUG}/json/list`)).json();
  const t = list.find((x) => x.type === "page");
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const ev = async (expr) => {
    const r = await cdp.send("Runtime.evaluate", {
      expression: expr, returnByValue: true, awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const waitFor = async (expr, ms = 6000) => {
    const t0 = Date.now();
    for (;;) {
      const v = await ev(expr).catch(() => null);
      if (v) return v;
      if (Date.now() - t0 > ms) return null;
      await sleep(250);
    }
  };
  // React-controlled <select>: use the prototype setter, then bubble 'change'.
  const setSelect = (el, val) => ev(`(() => {
    const el = arguments0;
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(el, ${JSON.stringify(val)});
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.value;
  })()`) /* replaced below */;

  // ---- seed auth -------------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/login" });
  await sleep(2500);
  await ev(`localStorage.setItem("token", ${JSON.stringify(TOKEN)}); localStorage.setItem("user", ${JSON.stringify(USER)}); "ok"`);

  // ---- MANAGE PAGE -----------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/12" });
  await waitFor(`document.getElementById("exam-open-time") !== null`);
  await sleep(800);

  console.log("== Manage page /hod/exams/12 ==");

  const nativeTimeGone = await ev(`document.querySelectorAll('input[type="time"]').length`);
  check("no native 24h <input type=time> remains", nativeTimeGone === 0, `found ${nativeTimeGone}`);

  const readGroups = () => ev(`(() => {
    const read = (id) => {
      const hour = document.getElementById(id);
      if (!hour) return null;
      const group = hour.closest('[role="group"]');
      const [h, m, ap] = group.querySelectorAll("select");
      const label = (s) => s.options[s.selectedIndex]?.text;
      return {
        hour: label(h), minute: label(m), meridiem: label(ap),
        hVal: h.value, mVal: m.value, apVal: ap.value,
        disabled: [h.disabled, m.disabled, ap.disabled],
        hAria: h.getAttribute("aria-label"),
        color: getComputedStyle(h).color,
        bg: getComputedStyle(h).backgroundColor,
        dateColor: getComputedStyle(document.getElementById(id.replace("-time", "-date"))).color,
      };
    };
    return { open: read("exam-open-time"), close: read("exam-close-time") };
  })()`);

  let g = await waitFor(`(() => { const e = document.getElementById("exam-open-time"); return e && e.value ? true : null; })()`);
  g = await readGroups();
  console.log("  open field :", JSON.stringify(g.open));
  console.log("  close field:", JSON.stringify(g.close));

  check("open shows 5:20 PM (from 17:20)", g.open.hour === "5" && g.open.minute === "20" && g.open.meridiem === "PM", JSON.stringify(g.open));
  check("close shows 8:20 PM (from 20:20)", g.close.hour === "8" && g.close.minute === "20" && g.close.meridiem === "PM", JSON.stringify(g.close));
  check("hour/minute/meridiem all enabled when time set", g.open.disabled.every((d) => d === false), JSON.stringify(g.open.disabled));
  check("select text color matches date input", g.open.color === g.open.dateColor, `time=${g.open.color} date=${g.open.dateColor}`);
  check("select has visible (non-transparent) color", !/rgba\\(0, 0, 0, 0\\)/.test(g.open.color), g.open.color);

  // ---- interaction: set open to 07:05 AM, watch pending summary --------
  const doSelect = async (selExpr, val) => ev(`(() => {
    const el = ${selExpr};
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(el, ${JSON.stringify(val)});
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return el.value;
  })()`);

  const groupChildren = (id, i) => `document.getElementById(${JSON.stringify(id)}).closest('[role="group"]').querySelectorAll("select")[${i}]`;

  await doSelect(groupChildren("exam-open-time", 0), "7");
  await doSelect(groupChildren("exam-open-time", 1), "05");
  await doSelect(groupChildren("exam-open-time", 2), "AM");
  await sleep(400);

  g = await readGroups();
  check("picking 7 / 05 / AM stores 07:05", g.open.hVal === "07:05", g.open.hVal);

  const pendingText = await ev(`[...document.querySelectorAll("p")].map(p => p.textContent).find(t => t.includes("Paper opens")) || ""`);
  check("pending summary shows 12-hour (07:05 AM)", /07:05\\s?AM/i.test(pendingText), pendingText.slice(0, 160));

  // ---- Save round trip --------------------------------------------------
  const clicked = await ev(`(() => {
    const btn = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Save");
    if (!btn) return "no-button";
    if (btn.disabled) return "disabled";
    btn.click();
    return "clicked";
  })()`);
  check("Save button clickable after change", clicked === "clicked", clicked);
  const notice = await waitFor(`document.querySelector(".notice")?.textContent || null`);
  check("notice after save", Boolean(notice), "");
  console.log("  notice:", (notice || "").slice(0, 180));
  check("notice uses 12-hour format", /07:05\\s?AM/i.test(notice || ""), notice);

  let api = await ev(`fetch("/api/exams/12", { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).then(r => r.json())`);
  check("backend startTime = 2026-10-06T07:05:00", api.startTime === "2026-10-06T07:05:00", api.startTime);
  check("backend endTime untouched = 20:20", api.endTime === "2026-10-06T20:20:00", api.endTime);

  // ---- restore original 17:20 ------------------------------------------
  await waitFor(`document.getElementById("exam-open-time") !== null`);
  await doSelect(groupChildren("exam-open-time", 0), "5");
  await doSelect(groupChildren("exam-open-time", 1), "20");
  await doSelect(groupChildren("exam-open-time", 2), "PM");
  await sleep(400);
  const clicked2 = await ev(`(() => {
    const btn = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Save");
    if (!btn || btn.disabled) return "no/disabled";
    btn.click(); return "clicked";
  })()`);
  check("restore Save clicked", clicked2 === "clicked", clicked2);
  await waitFor(`(document.querySelector(".notice")?.textContent || "").includes("Schedule saved")`);
  await sleep(600);
  api = await ev(`fetch("/api/exams/12", { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }).then(r => r.json())`);
  check("backend restored to 17:20", api.startTime === "2026-10-06T17:20:00", api.startTime);

  // ---- CREATE PAGE ------------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/new" });
  await waitFor(`document.getElementById("create-open-time") !== null`);
  await sleep(500);
  console.log("== Create page /hod/exams/new ==");

  const cg = await ev(`(() => {
    const hour = document.getElementById("create-open-time");
    const [h, m, ap] = hour.closest('[role="group"]').querySelectorAll("select");
    return { hour: h.value, minute: m.value, ap: ap.value, disabled: [h.disabled, m.disabled, ap.disabled] };
  })()`);
  check("empty time: hour shows placeholder", cg.hour === "", JSON.stringify(cg));
  check("empty time: minute+AM/PM gated until hour picked", cg.disabled[1] === true && cg.disabled[2] === true, JSON.stringify(cg.disabled));
  check("empty time: AM/PM defaults to AM", cg.ap === "AM", cg.ap);

  // set date + 09:00 AM open and 08:00 AM close (out of order) -> warning text
  await ev(`(() => {
    const d = document.getElementById("create-open-date");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(d, "2026-10-06");
    d.dispatchEvent(new Event("input", { bubbles: true }));
    d.dispatchEvent(new Event("change", { bubbles: true }));
    return d.value;
  })()`);
  await doSelect(groupChildren("create-open-time", 0), "9");
  await doSelect(groupChildren("create-open-time", 1), "00");
  await sleep(300);

  const cg2 = await ev(`(() => {
    const hour = document.getElementById("create-open-time");
    const [h, m, ap] = hour.closest('[role="group"]').querySelectorAll("select");
    return { hVal: h.value, hour: h.options[h.selectedIndex].text, minute: m.options[m.selectedIndex].text, ap: ap.options[ap.selectedIndex].text, mDisabled: m.disabled };
  })()`);
  check("create: picking hour 9 enables minute (09:00 default)", cg2.hVal === "09:00" && cg2.mDisabled === false, JSON.stringify(cg2));

  await ev(`(() => {
    const d = document.getElementById("create-close-date");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(d, "2026-10-06");
    d.dispatchEvent(new Event("input", { bubbles: true }));
    d.dispatchEvent(new Event("change", { bubbles: true }));
    return d.value;
  })()`);
  await doSelect(groupChildren("create-close-time", 0), "8");
  await doSelect(groupChildren("create-close-time", 1), "00");
  await sleep(400);

  const warn = await ev(`[...document.querySelectorAll("p")].map(p => p.textContent).find(t => t.includes("not after opening")) || ""`);
  check("create: out-of-order warning appears", Boolean(warn), "");
  check("create: warning times are 12-hour", /09:00\\s?AM/i.test(warn) && /08:00\\s?AM/i.test(warn), warn.slice(0, 200));
  console.log("  warning:", warn.slice(0, 200));

  console.log(`\\nRESULT: ${pass} passed, ${fail} failed`);
  ws.close();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error("ERR", e); process.exit(1); });

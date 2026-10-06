// Temp verification for the 12-hour time control - delete after use.
// Backslash-free on purpose: all matching uses flat()/includes().
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
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + " :: " + (detail === undefined ? "" : detail)); }
}
// lowercased, alphanumerics only: "07:05 am" -> "0705am" (locale-proof)
const flat = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function main() {
  const list = await (await fetch(DEBUG + "/json/list")).json();
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
  const waitFor = async (expr, ms = 8000) => {
    const t0 = Date.now();
    for (;;) {
      const v = await ev(expr).catch(() => null);
      if (v) return v;
      if (Date.now() - t0 > ms) return null;
      await sleep(250);
    }
  };
  // React-controlled <select>: prototype setter, then bubble "change".
  const doSelect = (selExpr, val) =>
    ev(
      "(() => { const el = " + selExpr + ";" +
      " const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;" +
      " setter.call(el, " + JSON.stringify(val) + ");" +
      " el.dispatchEvent(new Event('change', { bubbles: true })); return el.value; })()"
    );
  const setDate = (selExpr, val) =>
    ev(
      "(() => { const el = " + selExpr + ";" +
      " const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;" +
      " setter.call(el, " + JSON.stringify(val) + ");" +
      " el.dispatchEvent(new Event('input', { bubbles: true }));" +
      " el.dispatchEvent(new Event('change', { bubbles: true })); return el.value; })()"
    );
  const groupChild = (id, i) =>
    "document.getElementById(" + JSON.stringify(id) + ").closest('[role=\"group\"]').querySelectorAll('select')[" + i + "]";
  const getExam = () =>
    ev("fetch('http://localhost:8080/api/exams/12', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json())");

  // ---- seed auth -------------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/login" });
  await sleep(2500);
  await ev("localStorage.setItem('token', " + JSON.stringify(TOKEN) + "); localStorage.setItem('user', " + JSON.stringify(USER) + "); 'ok'");

  // ---- MANAGE PAGE -----------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/12" });
  await waitFor("document.getElementById('exam-open-time') !== null");
  await sleep(800);
  console.log("== Manage page /hod/exams/12 ==");

  const nativeTimeGone = await ev("document.querySelectorAll('input[type=\"time\"]').length");
  check("no native 24h <input type=time> remains", nativeTimeGone === 0, "found " + nativeTimeGone);

  const readGroups = () => ev(
    "(() => {" +
    " const read = (id) => {" +
    "  const hour = document.getElementById(id);" +
    "  if (!hour) return null;" +
    "  const group = hour.closest('[role=\"group\"]');" +
    "  const [h, m, ap] = group.querySelectorAll('select');" +
    "  const label = (s) => s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : '';" +
    "  const num = (c) => c.replace('rgb(', '').replace(')', '').split(',').map((x) => Number(x.trim()));" +
    "  const hc = num(getComputedStyle(h).color);" +
    "  const dc = num(getComputedStyle(document.getElementById(id.replace('-time', '-date'))).color);" +
    "  return {" +
    "   hour: label(h), minute: label(m), meridiem: label(ap)," +
    "   hVal: h.value, mVal: m.value, apVal: ap.value," +
    "   disabled: [h.disabled, m.disabled, ap.disabled]," +
    "   hAria: h.getAttribute('aria-label')," +
    "   hourSel: h.selectedIndex," +
    "   colorLight: hc[0] > 150 && hc[1] > 150 && hc[2] > 150," +
    "   dateLight: dc[0] > 150 && dc[1] > 150 && dc[2] > 150" +
    "  };" +
    " };" +
    " return { open: read('exam-open-time'), close: read('exam-close-time') };" +
    "})()"
  );

  await waitFor("(() => { const e = document.getElementById('exam-open-time'); return e && e.value ? true : null; })()");
  let g = await readGroups();
  console.log("  open field :", JSON.stringify(g.open));
  console.log("  close field:", JSON.stringify(g.close));

  check("open shows 5:20 PM (from 17:20)", g.open.hour === "5" && g.open.minute === "20" && g.open.meridiem === "PM", JSON.stringify(g.open));
  check("close shows 8:20 PM (from 20:20)", g.close.hour === "8" && g.close.minute === "20" && g.close.meridiem === "PM", JSON.stringify(g.close));
  check("hour/minute/meridiem all enabled when time set", g.open.disabled.every((d) => d === false), JSON.stringify(g.open.disabled));
  check("select text is light-on-dark (visible)", g.open.colorLight, JSON.stringify(g.open));
  check("date input text is light-on-dark (visible)", g.open.dateLight, JSON.stringify(g.open));
  check("hour select keeps a descriptive aria-label", (g.open.hAria || "").includes("hour"), g.open.hAria);

  // ---- interaction: set open to 07:05 AM, watch pending summary --------
  await doSelect(groupChild("exam-open-time", 0), "7");
  await doSelect(groupChild("exam-open-time", 1), "05");
  await doSelect(groupChild("exam-open-time", 2), "AM");
  await sleep(400);

  g = await readGroups();
  check("picking 7 / 05 / AM updates the controls", g.open.hVal === "7" && g.open.mVal === "05" && g.open.apVal === "AM", JSON.stringify(g.open));

  const pendingText = await ev("[...document.querySelectorAll('p')].map(p => p.textContent).find(t => t.includes('Paper opens')) || ''");
  check("pending summary shows 12-hour (07:05 am)", flat(pendingText).includes("0705am"), pendingText.slice(0, 160));

  // ---- Save round trip --------------------------------------------------
  const clicked = await ev(
    "(() => { const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save');" +
    " if (!btn) return 'no-button'; if (btn.disabled) return 'disabled'; btn.click(); return 'clicked'; })()"
  );
  check("Save button clickable after change", clicked === "clicked", clicked);

  const notice = await waitFor("document.querySelector('.notice') ? document.querySelector('.notice').textContent : null");
  check("notice after save", Boolean(notice), "");
  if (notice) console.log("  notice:", notice.slice(0, 180));

  const savedSummary = await ev("[...document.querySelectorAll('p')].map(p => p.textContent).find(t => t.includes('Paper opens')) || ''");
  check("post-save summary shows 12-hour (07:05 am)", flat(savedSummary).includes("0705am"), savedSummary.slice(0, 160));

  let api = await getExam();
  check("backend startTime = 2026-10-06T07:05:00", api.startTime === "2026-10-06T07:05:00", api.startTime);
  check("backend endTime untouched = 20:20", api.endTime === "2026-10-06T20:20:00", api.endTime);

  // ---- restore original 17:20 ------------------------------------------
  await waitFor("document.getElementById('exam-open-time') !== null");
  await doSelect(groupChild("exam-open-time", 0), "5");
  await doSelect(groupChild("exam-open-time", 1), "20");
  await doSelect(groupChild("exam-open-time", 2), "PM");
  await sleep(400);
  const clicked2 = await ev(
    "(() => { const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save');" +
    " if (!btn || btn.disabled) return 'no/disabled'; btn.click(); return 'clicked'; })()"
  );
  check("restore Save clicked", clicked2 === "clicked", clicked2);
  await waitFor("(document.querySelector('.notice') ? document.querySelector('.notice').textContent : '').includes('Schedule saved')");
  await sleep(800);
  api = await getExam();
  check("backend restored to 17:20", api.startTime === "2026-10-06T17:20:00", api.startTime);
  check("backend close still 20:20", api.endTime === "2026-10-06T20:20:00", api.endTime);

  // ---- CREATE PAGE ------------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/new" });
  await waitFor("document.getElementById('create-open-time') !== null");
  await sleep(500);
  console.log("== Create page /hod/exams/new ==");

  const cg = await ev(
    "(() => { const hour = document.getElementById('create-open-time');" +
    " const [h, m, ap] = hour.closest('[role=\"group\"]').querySelectorAll('select');" +
    " return { hour: h.value, minute: m.value, ap: ap.value, disabled: [h.disabled, m.disabled, ap.disabled] }; })()"
  );
  check("empty time: hour shows placeholder", cg.hour === "", JSON.stringify(cg));
  check("empty time: minute+AM/PM gated until hour picked", cg.disabled[1] === true && cg.disabled[2] === true, JSON.stringify(cg.disabled));
  check("empty time: AM/PM defaults to AM", cg.ap === "AM", cg.ap);

  await setDate("document.getElementById('create-open-date')", "2026-10-06");
  await doSelect(groupChild("create-open-time", 0), "9");
  await doSelect(groupChild("create-open-time", 1), "00");
  await sleep(300);

  const cg2 = await ev(
    "(() => { const hour = document.getElementById('create-open-time');" +
    " const [h, m, ap] = hour.closest('[role=\"group\"]').querySelectorAll('select');" +
    " return { hVal: h.value, mDisabled: m.disabled, apVal: ap.value }; })()"
  );
  check("create: picking hour 9 sets 09:00 and enables minute", cg2.hVal === "09:00" && cg2.mDisabled === false, JSON.stringify(cg2));

  await setDate("document.getElementById('create-close-date')", "2026-10-06");
  await doSelect(groupChild("create-close-time", 0), "8");
  await doSelect(groupChild("create-close-time", 1), "00");
  await sleep(400);

  const warn = await ev("[...document.querySelectorAll('p')].map(p => p.textContent).find(t => t.includes('not after opening')) || ''");
  check("create: out-of-order warning appears", Boolean(warn), "");
  check("create: warning times are 12-hour", flat(warn).includes("0900am") && flat(warn).includes("0800am"), warn.slice(0, 220));
  if (warn) console.log("  warning:", warn.slice(0, 220));

  console.log("");
  console.log("RESULT: " + pass + " passed, " + fail + " failed");
  ws.close();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error("ERR", e); process.exit(1); });

// Temp verification for the "Auto-fix closing time" option - delete after use.
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
  const readTime = (id) =>
    ev(
      "(() => { const h = document.getElementById(" + JSON.stringify(id) + ");" +
      " if (!h) return null;" +
      " const s = h.closest('[role=\"group\"]').querySelectorAll('select');" +
      " const lab = (x) => x.options[x.selectedIndex] ? x.options[x.selectedIndex].text : '';" +
      " return { h: lab(s[0]), m: lab(s[1]), ap: lab(s[2]) }; })()"
    );
  const readCheckbox = (page) =>
    ev(
      "(() => { const lab = [...document.querySelectorAll('label')].find(l => l.textContent.includes('Auto-fix closing time'));" +
      " if (!lab) return { present: false };" +
      " const cb = lab.querySelector('input[type=checkbox]');" +
      " return { present: true, checked: cb.checked, text: lab.textContent.trim() }; })()"
    );
  const toggleCheckbox = () =>
    ev(
      "(() => { const lab = [...document.querySelectorAll('label')].find(l => l.textContent.includes('Auto-fix closing time'));" +
      " if (!lab) return 'missing';" +
      " lab.querySelector('input[type=checkbox]').click(); return 'clicked'; })()"
    );
  const clickSave = () =>
    ev(
      "(() => { const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save');" +
      " if (!btn) return 'no-button'; if (btn.disabled) return 'disabled'; btn.click(); return 'clicked'; })()"
    );
  const getExam = () =>
    ev("fetch('http://localhost:8080/api/exams/12', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json())");

  // ---- seed auth -------------------------------------------------------
  await cdp.send("Page.navigate", { url: "http://localhost:5173/login" });
  await sleep(2500);
  await ev("localStorage.setItem('token', " + JSON.stringify(TOKEN) + "); localStorage.setItem('user', " + JSON.stringify(USER) + "); 'ok'");

  // ======================================================================
  // MANAGE PAGE - auto-fix on
  // ======================================================================
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/12" });
  await waitFor("document.getElementById('exam-open-time') !== null");
  await sleep(600);
  console.log("== Manage page: auto-fix ON ==");

  let cb = await readCheckbox();
  check("checkbox present and ON by default", cb.present === true && cb.checked === true, JSON.stringify(cb));

  let open = await readTime("exam-open-time");
  let close = await readTime("exam-close-time");
  check("starts at 5:20 PM / 8:20 PM", open.h === "5" && open.ap === "PM" && close.h === "8" && close.ap === "PM", JSON.stringify({ open, close }));

  // change opening hour 5 -> 6 with auto-fix on: closing must follow +180min
  await doSelect(groupChild("exam-open-time", 0), "6");
  await sleep(400);
  open = await readTime("exam-open-time");
  close = await readTime("exam-close-time");
  check("opening moved to 6:20 PM", open.h === "6" && open.m === "20" && open.ap === "PM", JSON.stringify(open));
  check("closing auto-followed to 9:20 PM (21:20)", close.h === "9" && close.m === "20" && close.ap === "PM", JSON.stringify(close));

  const summary = await ev("[...document.querySelectorAll('p')].map(p => p.textContent).find(t => t.includes('Paper opens')) || ''");
  check("summary shows adjusted close 09:20 pm", flat(summary).includes("0920pm"), summary.slice(0, 160));

  const save1 = await clickSave();
  check("Save #1 clicked", save1 === "clicked", save1);
  await waitFor("document.querySelector('.notice') ? document.querySelector('.notice').textContent : null");
  await sleep(500);
  let api = await getExam();
  check("backend saved 18:20 / 21:20", api.startTime === "2026-10-06T18:20:00" && api.endTime === "2026-10-06T21:20:00", api.startTime + " / " + api.endTime);

  // ======================================================================
  // MANAGE PAGE - auto-fix OFF: closing must stay put
  // ======================================================================
  console.log("== Manage page: auto-fix OFF ==");
  const toggled = await toggleCheckbox();
  check("checkbox toggled off", toggled === "clicked", toggled);
  cb = await readCheckbox();
  check("checkbox now OFF", cb.checked === false, JSON.stringify(cb));

  await doSelect(groupChild("exam-open-time", 0), "7"); // 6:20 PM -> 7:20 PM
  await sleep(400);
  open = await readTime("exam-open-time");
  close = await readTime("exam-close-time");
  check("opening moved to 7:20 PM", open.h === "7" && open.ap === "PM", JSON.stringify(open));
  check("closing NOT touched (still 9:20 PM)", close.h === "9" && close.m === "20" && close.ap === "PM", JSON.stringify(close));

  // ======================================================================
  // Restore original 17:20 / 20:20 manually and save
  // ======================================================================
  console.log("== Restore original slot ==");
  await doSelect(groupChild("exam-open-time", 0), "5"); // -> 5:20 PM (no auto now)
  await sleep(300);
  await doSelect(groupChild("exam-close-time", 0), "8"); // 9:20 -> 8:20 PM
  await sleep(300);
  open = await readTime("exam-open-time");
  close = await readTime("exam-close-time");
  check("manual restore shows 5:20 PM / 8:20 PM", open.h === "5" && open.ap === "PM" && close.h === "8" && close.ap === "PM", JSON.stringify({ open, close }));

  const save2 = await clickSave();
  check("Save #2 clicked", save2 === "clicked", save2);
  await waitFor("document.querySelector('.notice') ? document.querySelector('.notice').textContent : null");
  await sleep(500);
  api = await getExam();
  check("backend restored to 17:20 / 20:20", api.startTime === "2026-10-06T17:20:00" && api.endTime === "2026-10-06T20:20:00", api.startTime + " / " + api.endTime);
  check("status still PUBLISHED", api.status === "PUBLISHED", api.status);

  // ======================================================================
  // CREATE PAGE - checkbox + duration follows
  // ======================================================================
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/new" });
  await waitFor("document.getElementById('create-open-time') !== null");
  await sleep(500);
  console.log("== Create page ==");

  cb = await readCheckbox();
  check("create: checkbox present and ON by default", cb.present === true && cb.checked === true, JSON.stringify(cb));

  await setDate("document.getElementById('create-open-date')", "2026-10-06");
  await doSelect(groupChild("create-open-time", 0), "9"); // 09:00 AM
  await sleep(250);
  await setDate("document.getElementById('create-close-date')", "2026-10-06");
  await doSelect(groupChild("create-close-time", 0), "10"); // 10:00 AM
  await sleep(300);

  let cOpen = await readTime("create-open-time");
  let cClose = await readTime("create-close-time");
  check("create: slot set 9:00 AM / 10:00 AM", cOpen.h === "9" && cOpen.ap === "AM" && cClose.h === "10" && cClose.ap === "AM", JSON.stringify({ cOpen, cClose }));

  // duration 60 -> 120 with auto-fix on: closing must become 11:00 AM
  const setDuration = (val) =>
    ev(
      "(() => { const lab = [...document.querySelectorAll('label')].find(l => l.textContent.includes('Duration'));" +
      " const input = lab.nextElementSibling;" +
      " const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;" +
      " setter.call(input, " + JSON.stringify(val) + ");" +
      " input.dispatchEvent(new Event('input', { bubbles: true }));" +
      " input.dispatchEvent(new Event('change', { bubbles: true })); return input.value; })()"
    );
  const dur1 = await setDuration("120");
  await sleep(300);
  check("duration input accepts 120", dur1 === "120", dur1);
  cClose = await readTime("create-close-time");
  check("create: closing auto-followed duration -> 11:00 AM", cClose.h === "11" && cClose.m === "00" && cClose.ap === "AM", JSON.stringify(cClose));

  // auto-fix off: duration change must NOT move closing
  await toggleCheckbox();
  await sleep(150);
  cb = await readCheckbox();
  check("create: checkbox toggled OFF", cb.checked === false, JSON.stringify(cb));
  const dur2 = await setDuration("150");
  await sleep(300);
  check("duration input accepts 150", dur2 === "150", dur2);
  cClose = await readTime("create-close-time");
  check("create: closing unchanged at 11:00 AM with auto-fix off", cClose.h === "11" && cClose.ap === "AM", JSON.stringify(cClose));

  // navigate away without saving (leaves no data behind)
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams" });
  await sleep(500);

  console.log("");
  console.log("RESULT: " + pass + " passed, " + fail + " failed");
  ws.close();
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error("ERR", e); process.exit(1); });

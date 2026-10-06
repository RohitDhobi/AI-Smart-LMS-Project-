// Temp verification script - delete after use.
const DEBUG = "http://localhost:9333";

const TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJob2RAZXhhbXBsZS5jb20iLCJpYXQiOjE3OTEyOTIwNDAsImV4cCI6MTc5MTM3ODQ0MH0.4d-CcyLmOkJDk2X-h4_kWu4mFv3W-f1euuh0TfSFCPY";
const USER = JSON.stringify({
  id: 46, name: "Head of Department", email: "hod@example.com", role: "HOD",
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  const list = await (await fetch(`${DEBUG}/json/list`)).json();
  return list.find((t) => t.type === "page");
}

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

async function main() {
  const t = await getTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const cdp = new CDP(ws);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const evalJs = async (expr) => {
    const r = await cdp.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  // 1. seed auth on the origin
  await cdp.send("Page.navigate", { url: "http://localhost:5173/login" });
  await sleep(2500);
  await evalJs(
    `localStorage.setItem("token", ${JSON.stringify(TOKEN)}); localStorage.setItem("user", ${JSON.stringify(USER)}); "ok"`
  );

  // 2. go to exam manage page
  await cdp.send("Page.navigate", { url: "http://localhost:5173/hod/exams/12" });
  await sleep(3500);

  const info = await evalJs(`(() => {
    const el = document.getElementById("exam-open-time");
    if (!el) return { found: false, url: location.href };
    const r = el.getBoundingClientRect();
    el.value = "17:20"; // fixed PM value so screenshots are comparable
    return { found: true, lang: el.lang, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, value: el.value };
  })()`);
  console.log("FIELD:", JSON.stringify(info));
  if (!info.found) { console.log("FAIL: time input not found"); process.exit(1); }

  const clip = {
    x: Math.max(0, info.rect.x - 2),
    y: Math.max(0, info.rect.y - 2),
    width: info.rect.w + 4,
    height: info.rect.h + 4,
    scale: 1,
  };

  async function shot(tag) {
    const r = await cdp.send("Page.captureScreenshot", { format: "png", clip });
    return r.data;
  }

  const setLang = (l) =>
    evalJs(`(() => { const el = document.getElementById("exam-open-time");
      ${l === null ? "el.removeAttribute('lang')" : `el.setAttribute("lang", ${JSON.stringify(l)})`};
      return el.getAttribute("lang"); })()`);

  // determinism check: same state twice must be byte-identical
  const a1 = await shot();
  await sleep(300);
  const a2 = await shot();
  console.log("determinism:", a1 === a2 ? "IDENTICAL (ok)" : "DIFFERS (unreliable!)");

  await setLang("en-GB");
  await sleep(200);
  const gb = await shot();

  await setLang("en-US");
  await sleep(200);
  const us = await shot();

  await setLang(null);
  await sleep(200);
  const none = await shot();

  console.log("en-GB vs en-US:", gb === us ? "SAME (lang has NO effect)" : "DIFFER (lang controls format)");
  console.log("no-lang vs en-US:", none === us ? "SAME (no-lang already en-US style)" : "DIFFER (attribute changes rendering)");
  console.log("no-lang vs en-GB:", none === gb ? "SAME (no-lang = 24h style)" : "DIFFER");

  // Which style is which? Use a value only distinguishable in 12h: set "00:00"
  // en-US renders "12:00 AM", en-GB renders "00:00" -> always differ either way.
  // Direction check: compare text pixel counts (12h adds AM/PM => more ink).
  const countInk = (b64) => {
    const buf = Buffer.from(b64, "base64");
    // decode PNG minimally using zlib inflate + unfilter
    const zlib = require("zlib");
    let pos = 8, w = 0, h = 0, bitDepth = 0, colorType = 0;
    const idat = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString("ascii", pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === "IHDR") {
        w = data.readUInt32BE(0); h = data.readUInt32BE(4);
        bitDepth = data[8]; colorType = data[9];
      } else if (type === "IDAT") idat.push(data);
      pos += 12 + len;
      if (type === "IEND") break;
    }
    if (bitDepth !== 8) return { err: "bitDepth " + bitDepth };
    const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
    if (!bpp) return { err: "colorType " + colorType };
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = w * bpp;
    const prev = Buffer.alloc(stride);
    let cur = Buffer.alloc(stride);
    let ink = 0, total = 0;
    let off = 0;
    for (let y = 0; y < h; y++) {
      const filter = raw[off++];
      raw.copy(cur, 0, off, off + stride);
      off += stride;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        let v = cur[i];
        if (filter === 1) v = (v + a) & 255;
        else if (filter === 2) v = (v + b) & 255;
        else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
        else if (filter === 4) {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
        }
        cur[i] = v;
      }
      // count near-white pixels (text on dark bg)
      for (let i = 0; i < stride; i += bpp) {
        total++;
        if (cur[i] > 180 && cur[i + 1] > 180 && cur[i + 2] > 180) ink++;
      }
      cur.copy(prev);
    }
    return { ink, total };
  };

  const inkGB = countInk(gb), inkUS = countInk(us), inkNone = countInk(none);
  console.log("ink en-GB:", JSON.stringify(inkGB));
  console.log("ink en-US:", JSON.stringify(inkUS));
  console.log("ink no-lang:", JSON.stringify(inkNone));

  ws.close();
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});

import zlib from "node:zlib";

// Temp verification 2: does lang affect a freshly-created time input?
const DEBUG = "http://localhost:9333";
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

function countInk(b64) {
  const buf = Buffer.from(b64, "base64");
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
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  let off = 0, ink = 0;
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
    for (let i = 0; i < stride; i += bpp) {
      if (cur[i] > 170 && cur[i + 1] > 170 && cur[i + 2] > 170) ink++;
    }
    cur.copy(prev);
  }
  return ink;
}

async function main() {
  const t = await getTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const evalJs = async (expr) => {
    const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };

  // Build a standalone probe page (no auth needed) in the same origin.
  await cdp.send("Page.navigate", { url: "about:blank" });
  await sleep(500);
  await evalJs(`document.title = "probe"; document.body.style.background = "#0b1220"; "ok"`);

  // Fresh input created with a given lang, pinned at a known position.
  const makeInput = (lang) =>
    evalJs(`(() => {
      document.body.innerHTML = "";
      const i = document.createElement("input");
      i.type = "time";
      ${lang ? `i.setAttribute("lang", ${JSON.stringify(lang)});` : ""}
      i.value = "17:20";
      i.style.cssText = "position:absolute;left:40px;top:40px;width:160px;height:44px;font-size:16px;";
      document.body.appendChild(i);
      const r = i.getBoundingClientRect();
      return { lang: i.getAttribute("lang"), x: r.x, y: r.y, w: r.width, h: r.height };
    })()`);

  async function shotRect(rect) {
    const r = await cdp.send("Page.captureScreenshot", {
      format: "png",
      clip: { x: rect.x - 2, y: rect.y - 2, width: rect.w + 4, height: rect.h + 4, scale: 1 },
    });
    return r.data;
  }

  const results = {};
  for (const lang of ["en-US", "en-GB", "en-IN", null]) {
    const rect = await makeInput(lang);
    await sleep(250);
    const png = await shotRect(rect);
    results[String(lang)] = png;
    console.log(`lang=${lang}: ink=${countInk(png)} bytes=${png.length}`);
  }

  const keys = Object.keys(results);
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++)
      console.log(`${keys[i]} vs ${keys[j]}: ${results[keys[i]] === results[keys[j]] ? "SAME" : "DIFFER"}`);

  // Also probe: navigator.language / resolved locale hour cycle in this Chrome
  const probe = await evalJs(`({
    navLang: navigator.language,
    langs: navigator.languages,
    usHour: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, 17, 20)),
    gbHour: new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, 17, 20)),
    resolved: new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle,
  })`);
  console.log("locale probe:", JSON.stringify(probe));

  ws.close();
}

main().catch((e) => { console.error("ERR", e); process.exit(1); });

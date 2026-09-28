// Temporary audit: logs into the running app, opens a page in headless Chrome
// and reports elements with white backgrounds or unreadable text contrast.
// Usage: node audit-page.mjs [url] [theme]
const DEBUG_PORT = 9333;
const PAGE_URL = process.argv[2] || "http://localhost:5173/hod/subjects";
const THEME = process.argv[3] || "dark";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 1. log in against the real backend --------------------------------
const loginRes = await fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
});
const login = await loginRes.json().catch(() => ({}));
const token = login.token || login.accessToken || login.jwt;
const user =
  login.user ||
  login.data || {
    name: "Head of Department",
    email: "hod@example.com",
    role: "HOD",
  };
if (!token) {
  console.error("LOGIN FAILED", loginRes.status, JSON.stringify(login));
  process.exit(1);
}
console.log("logged in as", user.email || user.name, "| role", user.role);

// ---- 2. attach to the headless Chrome we launched ----------------------
const targets = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then(
  (r) => r.json()
);
const page = targets.find((t) => t.type === "page");
if (!page) {
  console.error("no page target");
  process.exit(1);
}
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
await new Promise((res, rej) => {
  ws.addEventListener("open", res);
  ws.addEventListener("error", rej);
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails)
    throw new Error(JSON.stringify(r.exceptionDetails.exception));
  return r.result.value;
}

await send("Page.enable");
await send("Runtime.enable");

// seed auth + theme on the app origin first
await send("Page.navigate", { url: "http://localhost:5173/login" });
await sleep(2500);
await evaluate(
  `localStorage.setItem("token", ${JSON.stringify(token)});` +
    `localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});` +
    `localStorage.setItem("lms_theme", ${JSON.stringify(THEME)});` +
    `"ok"`
);

await send("Page.navigate", { url: PAGE_URL });
await sleep(7000);

// ---- 3. audit the rendered page ---------------------------------------
const AUDIT = `(() => {
  function parse(c) {
    const m = String(c).match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  const toHex = (c) =>
    "#" + [c.r, c.g, c.b].map((n) => ("0" + Math.round(n).toString(16)).slice(-2)).join("");
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  function effBg(el) {
    const chain = [];
    let cur = el;
    let base = null;
    while (cur) {
      const c = parse(getComputedStyle(cur).backgroundColor);
      if (c && c.a > 0) {
        chain.push(c);
        if (c.a >= 1) { base = c; break; }
      }
      cur = cur.parentElement;
    }
    base = base || { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 2; i >= 0; i--) base = over(chain[i], base);
    return base;
  }
  function lum(c) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  function path(el) {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && parts.length < 5) {
      const cls = (cur.className && typeof cur.className === "string"
        ? cur.className.trim().split(/\\s+/).slice(0, 3).join(".")
        : "");
      parts.unshift(cur.tagName.toLowerCase() + (cls ? "." + cls : ""));
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }
  const white = [];
  const low = [];
  const all = document.querySelectorAll("body *");
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.1) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const bg = parse(cs.backgroundColor);
    if (bg && bg.a > 0.5 && bg.r > 248 && bg.g > 248 && bg.b > 248) {
      white.push({ el: path(el), bg: toHex(bg), w: Math.round(rect.width), h: Math.round(rect.height) });
    }
    // direct text only
    const txt = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!txt) continue;
    const fgc = parse(cs.color);
    if (!fgc) continue;
    const eff = effBg(el);
    const fg = fgc.a < 1 ? over(fgc, eff) : fgc;
    const r = ratio(fg, eff);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (r < need) {
      low.push({
        el: path(el),
        text: txt.slice(0, 40),
        fg: toHex(fg),
        bg: toHex(eff),
        ratio: +r.toFixed(2),
        need,
        size,
      });
    }
  }
  // group repeated offenders so the report stays readable
  const groups = {};
  for (const item of low) {
    const key = item.el + " || " + item.fg + " on " + item.bg;
    if (!groups[key]) groups[key] = { ...item, count: 0 };
    groups[key].count++;
  }
  const grouped = Object.values(groups).sort((a, b) => a.ratio - b.ratio);
  return {
    url: location.href,
    theme: document.documentElement.getAttribute("data-theme"),
    whiteCount: white.length,
    white: white.slice(0, 25),
    lowCount: low.length,
    invisible: grouped.filter((g) => g.ratio < 2.5),
    grouped: grouped.slice(0, 40),
  };
})()`;

const result = await evaluate(AUDIT);
console.log(JSON.stringify(result, null, 2));
ws.close();
process.exit(0);

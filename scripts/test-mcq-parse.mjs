// Regression check: extracted REAL parse functions from InstructorAITools.jsx
// Verifies requested count == generated/displayed count for mcq and mixed.
import fs from "fs";

const src = fs.readFileSync("src/pages/instructor/InstructorAITools.jsx", "utf8");

// --- Extract the real parse helpers (they are self-contained, no component state) ---
const parseStart = src.indexOf("const TYPE_MARKS =");
const parseEnd = src.indexOf("let parsed = [];", parseStart);
const parseCode = src.slice(parseStart, parseEnd);

// --- Extract template pools (same as component) ---
function extractArr(name) {
  const start = src.indexOf(`const ${name} = [`);
  const end = src.indexOf("];", start);
  return new Function(`return ${src.slice(start + `const ${name} = `.length, end + 1)}`)();
}
const mcqTemplates = extractArr("mcqTemplates");
const linerTemplates = extractArr("linerTemplates");
const shortTemplates = extractArr("shortTemplates");
const mediumTemplates = extractArr("mediumTemplates");
const longTemplates = extractArr("longTemplates");

const topic = "java";

// Evaluate real parse functions
const { parseMCQQuestions, parseMixedQuestions, parseTextQuestions } =
  new Function(`${parseCode}; return { parseMCQQuestions, parseMixedQuestions, parseTextQuestions };`)();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pools exactly as built in generateQuestions
const mcqPool = mcqTemplates.map(t => ({ text: t.text(topic), answer: t.answer }));
const mixedPool = [
  ...mcqPool.map(o => ({ ...o, kind: "mcq" })),
  ...linerTemplates.map(fn => ({ text: fn(topic), kind: "1liner" })),
  ...shortTemplates.map(fn => ({ text: fn(topic), kind: "2marker" })),
  ...mediumTemplates.map(fn => ({ text: fn(topic), kind: "3marker" })),
  ...longTemplates.map(fn => ({ text: fn(topic), kind: "5marker" })),
];

function generate(pool, n) {
  const shuffled = shuffle(pool);
  const out = [];
  for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}

let failures = 0;
function check(label, cond, detail) {
  if (cond) console.log(`  PASS  ${label}`);
  else { failures++; console.log(`  FAIL  ${label} ${detail || ""}`); }
}

console.log("== MCQ mode: requested == displayed ==");
for (const n of [5, 10, 25, 50, 100]) {
  const parsed = parseMCQQuestions(generate(mcqPool, n), topic);
  const withOpts = parsed.filter(q => q.options.length > 0).length;
  check(`mcq n=${n} -> ${withOpts}`, withOpts === n, `(got ${withOpts})`);
}

console.log("== Mixed mode: requested == displayed (all types shown) ==");
for (const n of [5, 10, 25, 50, 100]) {
  const parsed = parseMixedQuestions(generate(mixedPool, n), topic);
  check(`mixed n=${n} -> ${parsed.length}`, parsed.length === n, `(got ${parsed.length})`);
}

console.log("== Mixed mode: types are honest (no text question labeled mcq) ==");
{
  const parsed = parseMixedQuestions(generate(mixedPool, 100), topic);
  const textLabeledMcq = parsed.filter(q => q.type === "mcq" && (!q.options || q.options.length === 0));
  check("no option-less item typed mcq", textLabeledMcq.length === 0, `(${textLabeledMcq.length} found)`);
  const badMarks = parsed.filter(q => q.marks !== ({ mcq: 1, "1liner": 1, "2marker": 2, "3marker": 3, "5marker": 5 }[q.type]));
  check("marks match type", badMarks.length === 0, `(${badMarks.length} wrong)`);
}

console.log("== Option parsing handles parens like O(1) ==");
{
  const tricky = "What is the time complexity of a typical java operation? (A) O(1) (B) O(log n) (C) O(n) (D) O(n²)";
  const [q] = parseMCQQuestions([{ text: tricky, answer: "C" }], topic);
  check(`4 options parsed (got ${q.options.length})`, q.options.length === 4);
  check(`opt A text = "${q.options[0]?.text}"`, q.options[0]?.text === "O(1)");
  check(`opt B text = "${q.options[1]?.text}"`, q.options[1]?.text === "O(log n)");
  check(`question text preserved`, q.question.startsWith("What is the time complexity"));
}

console.log("== Pure text mode still works ==");
{
  const joined = linerTemplates.slice(0, 5).map((fn, i) => `${i + 1}. ${fn(topic)}`).join("\n");
  const parsed = parseTextQuestions(joined, "1liner");
  check(`text n=5 -> ${parsed.length}`, parsed.length === 5);
  check(`text questions have question field`, parsed.every(q => q.question && q.text));
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);

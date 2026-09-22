// Count mixed pool composition from InstructorAITools.jsx
import fs from "fs";
const src = fs.readFileSync("src/pages/instructor/InstructorAITools.jsx", "utf8");

function extractArr(name) {
  const start = src.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`not found: ${name}`);
  const end = src.indexOf("];", start);
  return new Function(`return ${src.slice(start + `const ${name} = `.length, end + 1)}`)();
}

const mcq = extractArr("mcqTemplates");
const liner = extractArr("linerTemplates");
const short = extractArr("shortTemplates");
const medium = extractArr("mediumTemplates");
const long = extractArr("longTemplates");
const total = mcq.length + liner.length + short.length + medium.length + long.length;
console.log({ mcq: mcq.length, liner: liner.length, short: short.length, medium: medium.length, long: long.length, total });
console.log("MCQ share of mixed:", (mcq.length / total * 100).toFixed(1) + "%");
for (const n of [5, 10, 25, 50, 100]) {
  console.log(`  requested ${n} -> expected quiz-visible (MCQ only) ~ ${(n * mcq.length / total).toFixed(1)}`);
}

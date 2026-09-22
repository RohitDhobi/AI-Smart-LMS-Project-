// Replicates generateQuestions + parseMCQQuestions from InstructorAITools.jsx
import fs from "fs";

const src = fs.readFileSync("src/pages/instructor/InstructorAITools.jsx", "utf8");

// Extract the mcqTemplates array literal
const start = src.indexOf("const mcqTemplates = [");
const end = src.indexOf("];", start);
const arrText = src.slice(start + "const mcqTemplates = ".length, end + 1);

const mcqTemplates = new Function(`return ${arrText}`)();
console.log("mcqTemplates count:", mcqTemplates.length);

const topic = "java";
const pool = mcqTemplates.map(t => ({ text: t.text(topic), answer: t.answer }));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(n) {
  const shuffled = shuffle(pool);
  const questions = [];
  for (let i = 0; i < n; i++) questions.push(shuffled[i % shuffled.length]);
  return questions;
}

function parseMCQQuestions(rawItems) {
  return rawItems.map((item, i) => {
    const line = typeof item === "object" ? item.text : item;
    const templateAnswer = typeof item === "object" ? item.answer : null;
    const cleaned = line.replace(/^\d+\.\s*/, "").trim();
    const optionRegex = /\(([A-D])\)\s*([^()]*?)(?=\s*\([A-D]\)|$)/g;
    const options = [];
    let match;
    while ((match = optionRegex.exec(cleaned)) !== null) {
      options.push({ letter: match[1], text: match[2].trim() });
    }
    const questionText = cleaned.replace(/\s*\([A-D]\)[\s\S]*$/, "").trim();
    const correctAnswer = templateAnswer || (options.length > 0 ? options[0].letter : "A");
    return { id: `ai-${i}`, question: questionText, options, correctAnswer, source: "AI", type: "mcq", marks: 1 };
  });
}

// Whole pool first
const allParsed = parseMCQQuestions(pool);
const survivors = allParsed.filter(q => q.options.length > 0);
console.log("Pool parse: total", allParsed.length, "| with options:", survivors.length);

const failures = allParsed.filter(q => q.options.length === 0);
console.log("Failed templates:", failures.length);
failures.slice(0, 10).forEach(q => console.log("  FAIL:", q.question));

// Simulate each requested count
for (const n of [5, 10, 25, 50, 100]) {
  const parsed = parseMCQQuestions(generateQuestions(n));
  const withOpts = parsed.filter(q => q.options.length > 0).length;
  console.log(`Requested ${n} -> parsed ${parsed.length} -> with options ${withOpts}`);
}

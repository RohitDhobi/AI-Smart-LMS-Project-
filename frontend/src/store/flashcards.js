// =====================================================
// FLASHCARDS (spaced repetition)
// localStorage-backed, keyed per course
// =====================================================

const STORAGE_KEY = "lms_flashcards_v1";

function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getCourseMap(courseId) {
  const data = load();
  if (!Array.isArray(data[courseId])) data[courseId] = [];
  return data;
}

export function getCards(courseId) {
  return getCourseMap(courseId)[courseId] || [];
}

export function saveCards(courseId, cards) {
  const data = load();
  data[courseId] = cards;
  saveAll(data);
  return cards;
}

export function addCard(courseId, front, back) {
  const cards = getCards(courseId);
  const card = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    front,
    back,
    intervalDays: 0,
    due: dayKey(), // due immediately
    box: 0,
  };
  cards.push(card);
  saveCards(courseId, cards);
  return card;
}

export function deleteCard(courseId, cardId) {
  saveCards(
    courseId,
    getCards(courseId).filter((c) => c.id !== cardId)
  );
}

// Auto-generate cards from lessons (front = title, back = description/content)
export function autoCards(courseId, lessons) {
  const existing = getCards(courseId);
  const existingFronts = new Set(
    existing.map((c) => c.front).filter((f) => f && f.startsWith("📘 "))
  );
  const added = [];

  (Array.isArray(lessons) ? lessons : []).forEach((lesson) => {
    const front = `📘 ${lesson.title || "Lesson"}`;
    if (existingFronts.has(front)) return;
    const back =
      lesson.description ||
      (lesson.content ? String(lesson.content).slice(0, 220) : "") ||
      "No summary available.";
    added.push(addCard(courseId, front, back));
  });

  return { added: added.length, cards: getCards(courseId) };
}

export function dueCards(courseId) {
  const today = dayKey();
  return getCards(courseId)
    .filter((c) => c.due <= today)
    .sort((a, b) => (a.due < b.due ? -1 : 1));
}

// Spaced repetition ratings -> next interval in days
const INTERVALS = { again: 0, hard: 1, good: 3, easy: 7 };

export function rateCard(courseId, cardId, rating) {
  const cards = getCards(courseId);
  const card = cards.find((c) => c.id === cardId);
  if (!card) return null;

  const interval = INTERVALS[rating] ?? 1;
  card.intervalDays = rating === "again" ? 0 : card.intervalDays + interval;
  card.box = rating === "again" ? 0 : Math.min(card.box + 1, 5);
  card.due = dayKey(new Date(Date.now() + card.intervalDays * 86400000));
  card.lastRating = rating;
  card.reviews = (card.reviews || 0) + 1;

  saveCards(courseId, cards);
  return card;
}

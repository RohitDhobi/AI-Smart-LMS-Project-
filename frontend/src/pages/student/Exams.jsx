import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { Loading, Empty, Page } from "../components/ui";

// =====================================================
// SCHEDULED DAY / TIME SLOT HELPERS
// =====================================================

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** End of the slot: explicit end, else start + duration, else null. */
function slotEnd(exam) {
  if (!exam) return null;
  if (exam.endTime) {
    const end = new Date(exam.endTime);
    if (!Number.isNaN(end.getTime())) return end;
  }
  if (exam.startTime) {
    const start = new Date(exam.startTime);
    if (!Number.isNaN(start.getTime())) {
      return new Date(start.getTime() + (exam.durationMinutes || 60) * 60000);
    }
  }
  return null;
}

/**
 * Where the paper stands right now:
 *   locked  - the slot has not started yet
 *   open    - inside the slot (or never scheduled, so always open)
 *   closed  - the slot has passed
 */
function slotState(exam, now) {
  const start = exam.startTime ? new Date(exam.startTime) : null;
  const end = slotEnd(exam);
  if (!start && !end) return "open";
  if (start && now < start) return "locked";
  if (end && now > end) return "closed";
  return "open";
}

function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const h = pad2(Math.floor((total % 86400) / 3600));
  const m = pad2(Math.floor((total % 3600) / 60));
  const s = pad2(total % 60);
  return `${days > 0 ? `${days}d ` : ""}${h}:${m}:${s}`;
}

// =====================================================
// QUESTION PAPER HELPERS
// =====================================================

function parsePaper(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Sections with their questions, flattened to a stable global order. */
function flattenPaper(paper) {
  if (!paper) return [];
  const out = [];
  const push = (sectionName, questions) => {
    (Array.isArray(questions) ? questions : []).forEach((q) => {
      out.push({ ...q, section: sectionName });
    });
  };
  if (Array.isArray(paper.sections)) {
    paper.sections.forEach((s, i) =>
      push(s?.name || `Section ${i + 1}`, s?.questions)
    );
  }
  if (out.length === 0) push("Section A", paper.questions);
  return out;
}

// =====================================================
// EXAM ATTEMPT (full-screen, timed, ends with the slot)
// =====================================================

function ExamAttempt({ exam, onClose }) {
  const questions = useMemo(() => flattenPaper(parsePaper(exam.questionPaper)), [exam]);
  const deadline = useMemo(() => slotEnd(exam), [exam]);

  const [answers, setAnswers] = useState({});
  const [now, setNow] = useState(() => new Date());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);
  const autoTriedRef = useRef(false);

  // Ticking clock: drives the countdown and the auto-submit at the deadline.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = deadline ? deadline.getTime() - now.getTime() : null;

  async function handleSubmit() {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.submitExam(exam.id, answers);
      setResult(res);
    } catch (err) {
      submittedRef.current = false;
      setError(err.message || "Could not submit the paper.");
    } finally {
      setSubmitting(false);
    }
  }

  // Time's up: send whatever is filled in, then show the result. Runs once -
  // a rejected auto-submit must not retry every second.
  useEffect(() => {
    if (
      remaining !== null && remaining <= 0 &&
      !result && !submittedRef.current && !autoTriedRef.current
    ) {
      autoTriedRef.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, result]);

  const isMcq = (q) =>
    String(q.type || "mcq").toLowerCase().startsWith("mcq") &&
    Array.isArray(q.options) &&
    q.options.some((o) => String(o || "").trim());

  if (result) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>🎓 {exam.title} — submitted</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div style={{ textAlign: "center", padding: "18px 0 6px" }}>
            <div style={{ fontSize: 44, fontWeight: 800 }}>
              {result.percentage}%
            </div>
            <div style={{ color: "var(--text-secondary)" }}>
              {result.awardedMarks} / {result.gradedMarks} marks
              {result.passed ? " · Passed ✅" : " · Not passed ❌"}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "14px 0" }}>
            <div>
              <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Correct</b>
              <p style={{ margin: 0 }}>{result.correct}</p>
            </div>
            <div>
              <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Wrong</b>
              <p style={{ margin: 0 }}>{result.wrong}</p>
            </div>
            <div>
              <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Skipped</b>
              <p style={{ margin: 0 }}>{result.skipped}</p>
            </div>
            <div>
              <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Awaiting manual marking</b>
              <p style={{ margin: 0 }}>{result.pendingManual}</p>
            </div>
          </div>

          <button className="primary" style={{ width: "100%" }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        style={{ maxWidth: 760, maxHeight: "92vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head" style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
          <h3>📝 {exam.title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {remaining !== null && (
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 700,
                  color: remaining < 60000 ? "var(--danger)" : "var(--text)",
                }}
              >
                ⏳ {formatCountdown(remaining)}
              </span>
            )}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <p style={{ margin: "8px 0 16px", color: "var(--text-secondary)", fontSize: 13 }}>
          {questions.length} questions · {exam.totalMarks} marks · closes{" "}
          {deadline ? deadline.toLocaleString() : "at the end of the exam"}
        </p>

        {questions.map((q, i) => (
          <div key={i} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <strong>Q{i + 1}.</strong>
              <div>
                <span>{q.text || q.question}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
                  [{q.marks ?? 1} mark{q.marks === 1 ? "" : "s"}{q.section ? ` · ${q.section}` : ""}]
                </span>
              </div>
            </div>

            {isMcq(q) ? (
              <div style={{ display: "grid", gap: 6, marginLeft: 26 }}>
                {q.options.map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const checked = answers[String(i)] === letter;
                  return (
                    <label
                      key={oi}
                      style={{
                        display: "flex",
                        gap: 9,
                        alignItems: "flex-start",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${checked ? "var(--primary)" : "var(--border)"}`,
                        background: checked ? "var(--primary-light)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={checked}
                        onChange={() => setAnswers((a) => ({ ...a, [String(i)]: letter }))}
                        style={{ marginTop: 3 }}
                      />
                      <span>
                        <b>{letter}.</b> {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                className="inst-textarea"
                rows={3}
                style={{ marginLeft: 26, width: "calc(100% - 26px)" }}
                placeholder="Write your answer..."
                value={answers[String(i)] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [String(i)]: e.target.value }))}
              />
            )}
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 18, position: "sticky", bottom: 0, background: "var(--surface)", padding: "12px 0" }}>
          <button className="secondary" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>
            Save &amp; close
          </button>
          <button className="primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit paper"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// EXAMS LIST (student view)
// =====================================================

function Exams() {

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [now, setNow] = useState(() => new Date());

  // One shared clock so every card's countdown and lock state stay in step.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [examList, courseList] = await Promise.all([
        api.exams(),
        api.courses().catch(() => [])
      ]);

      setExams(Array.isArray(examList) ? examList : []);
      setCourses(Array.isArray(courseList) ? courseList : []);

    } catch (e) {
      setError(e.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  /** Fetch the paper fresh - the backend only hands it out inside the slot. */
  async function openPaper(exam) {
    try {
      setError("");
      const fresh = await api.exam(exam.id);
      if (!fresh?.questionPaper) {
        setError(
          `The paper for "${exam.title}" is not available yet. It opens at ${
            exam.startTime ? new Date(exam.startTime).toLocaleString() : "the scheduled time"
          }.`
        );
        return;
      }
      setAttempt(fresh);
    } catch (e) {
      setError(e.message || "Unable to open this exam.");
    }
  }

  const filtered = exams.filter(exam =>
    !search.trim() ||
    exam.title?.toLowerCase().includes(search.trim().toLowerCase()) ||
    exam.course?.title?.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <Page
      title="Exams"
      subtitle="View and prepare for your upcoming exams."
    >

      {error && <div className="error">{error}</div>}

      <div className="dash-search" style={{ maxWidth: 400, marginBottom: 20 }}>
        <span>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exams..."
        />
      </div>

      {filtered.length === 0 ? (
        <Empty text="No exams scheduled yet." />
      ) : (
        <div className="quizzes-grid">
          {filtered.map(exam => {
            const state = slotState(exam, now);
            const start = exam.startTime ? new Date(exam.startTime) : null;
            const end = slotEnd(exam);
            const isPast = end && now > end;

            return (
              <div className="card quiz-card" key={exam.id}>
                <div className="quiz-card-icon">🎓</div>

                <div className="quiz-card-head">
                  <span className="quiz-card-course">
                    {exam.course?.title || "General"}
                  </span>
                  <span
                    className="passed-badge"
                    style={{
                      background:
                        state === "open" ? "var(--success-light)"
                        : state === "closed" ? "var(--surface-soft)"
                        : "var(--primary-light)",
                      color:
                        state === "open" ? "var(--success)"
                        : state === "closed" ? "var(--text-muted)"
                        : "var(--primary)"
                    }}
                  >
                    {state === "open" ? "🔴 Live Now"
                      : state === "closed" ? "✓ Completed"
                      : "🔒 Locked"}
                  </span>
                </div>

                <h2>{exam.title}</h2>
                <p>{exam.description || "Final examination for this course."}</p>

                <div className="quiz-card-meta">
                  <span>⏱ {exam.durationMinutes || 60} min</span>
                  <span>📊 {exam.totalMarks || 100} marks</span>
                  <span>✅ Pass: {exam.passingMarks || 40}</span>
                </div>

                {start || end ? (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    📅 {start ? start.toLocaleString() : "immediate"}
                    {end && ` — ${end.toLocaleString()}`}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    📅 No time slot — always open
                  </div>
                )}

                {state === "locked" && start && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginTop: 6 }}>
                    🔒 Opens in {formatCountdown(start.getTime() - now.getTime())}
                  </div>
                )}

                {exam.negativeMarking && (
                  <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 4 }}>
                    ⚠️ Negative marking: -{exam.negativeMarkValue || 0.25} per wrong answer
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                  {state === "open" ? (
                    <button
                      className="primary quiz-take-btn"
                      onClick={() => openPaper(exam)}
                    >
                      Open Paper
                    </button>
                  ) : (
                    <button className="primary quiz-take-btn" disabled title={isPast ? "This exam is closed" : "Not open yet"}>
                      {isPast ? "Closed" : `🔒 Opens in ${formatCountdown(start.getTime() - now.getTime())}`}
                    </button>
                  )}
                  <button
                    className="secondary"
                    onClick={() => setSelectedExam(exam)}
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {attempt && (
        <ExamAttempt exam={attempt} onClose={() => { setAttempt(null); loadAll(); }} />
      )}

      {selectedExam && (
        <div className="modal-overlay" onClick={() => setSelectedExam(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>🎓 {selectedExam.title}</h3>
              <button className="modal-close" onClick={() => setSelectedExam(null)}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "12px 0" }}>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Course</b>
                <p style={{ margin: 0 }}>{selectedExam.course?.title || "—"}</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Duration</b>
                <p style={{ margin: 0 }}>{selectedExam.durationMinutes || 60} minutes</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Marks</b>
                <p style={{ margin: 0 }}>{selectedExam.totalMarks || 100}</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Passing Marks</b>
                <p style={{ margin: 0 }}>{selectedExam.passingMarks || 40}</p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Start Time</b>
                <p style={{ margin: 0 }}>
                  {selectedExam.startTime ? new Date(selectedExam.startTime).toLocaleString() : "Not scheduled"}
                </p>
              </div>
              <div>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>End Time</b>
                <p style={{ margin: 0 }}>
                  {selectedExam.endTime ? new Date(selectedExam.endTime).toLocaleString() : "Not scheduled"}
                </p>
              </div>
            </div>

            <div className="notice">
              {slotState(selectedExam, now) === "open"
                ? "✅ The paper is open — you can attempt it now."
                : slotState(selectedExam, now) === "closed"
                  ? "This exam's time slot has ended."
                  : `🔒 The paper opens on ${new Date(selectedExam.startTime).toLocaleString()}.`}
            </div>

            {selectedExam.description && (
              <div style={{ margin: "12px 0" }}>
                <b style={{ fontSize: 12, color: "var(--text-muted)" }}>Description</b>
                <p style={{ whiteSpace: "pre-wrap" }}>{selectedExam.description}</p>
              </div>
            )}

            {selectedExam.negativeMarking && (
              <div className="notice">
                ⚠️ This exam has negative marking: -{selectedExam.negativeMarkValue || 0.25} per wrong answer
              </div>
            )}
          </div>
        </div>
      )}

    </Page>
  );
}

export default Exams;

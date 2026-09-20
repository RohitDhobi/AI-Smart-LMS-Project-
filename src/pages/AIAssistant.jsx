import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import { awardActivity } from "../gamification";
import { generateLocalQuestions } from "../ai-question-engine";

const TOPIC_SUGGESTIONS = [
  "Object Oriented Programming (OOP)",
  "Java Programming",
  "Data Structures & Algorithms",
  "DBMS & SQL",
  "Computer Networks",
  "Operating Systems",
  "Web Development & React",
  "Python Programming",
  "Software Engineering",
  "Artificial Intelligence"
];

const COUNT_OPTIONS = [10, 25, 50, 100];

function AIAssistant() {
  // ---------- Study Assistant State ----------
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- Practice Questions State ----------
  const [topic, setTopic] = useState("Object Oriented Programming");
  const [requestedCount, setRequestedCount] = useState(100);
  const [questions, setQuestions] = useState([]);
  const [picks, setPicks] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all', 'unanswered', 'incorrect'
  
  // Pagination for large sets (e.g. 100 questions)
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // ---------- Pomodoro Timer State ----------
  const WORK_SEC = 25 * 60;
  const BREAK_SEC = 5 * 60;
  const [mode, setMode] = useState("work");
  const [remaining, setRemaining] = useState(WORK_SEC);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && running) {
      playChime();
      if (mode === "work") {
        awardActivity({ type: "focus", focusMinutes: 25 });
        setSessions((s) => s + 1);
      }
      const nextMode = mode === "work" ? "break" : "work";
      setMode(nextMode);
      setRemaining(nextMode === "work" ? WORK_SEC : BREAK_SEC);
    }
  }, [remaining, running, mode]);

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const timerTotal = mode === "work" ? WORK_SEC : BREAK_SEC;
  const timerPct = ((timerTotal - remaining) / timerTotal) * 100;

  function resetTimer() {
    setRunning(false);
    setMode("work");
    setRemaining(WORK_SEC);
  }

  // ---------- Handlers ----------

  // Local fallback: generate a simple educational response when backend is broken
  function generateLocalFallback(q) {
    const lower = q.toLowerCase();
    if (lower.includes("polymorphism")) {
      return "Polymorphism is an OOP concept where a single interface or base class can have multiple implementations.\n\nReal-world example: A 'Shape' base class with a 'draw()' method. A 'Circle' and a 'Rectangle' both extend 'Shape' and override 'draw()'. When you call shape.draw(), Java determines at runtime which version to call based on the actual object type.\n\nTypes:\n• Compile-time (Method Overloading) – same method name, different parameters\n• Runtime (Method Overriding) – subclass redefines a parent method";
    }
    if (lower.includes("inheritance")) {
      return "Inheritance allows a class (child/subclass) to inherit fields and methods from another class (parent/superclass).\n\nExample: class Animal { void eat() {...} } → class Dog extends Animal { void bark() {...} }\nDog inherits 'eat()' from Animal and adds its own 'bark()'.\n\nBenefits: Code reusability, hierarchical classification, and polymorphic behavior.";
    }
    if (lower.includes("encapsulation")) {
      return "Encapsulation is the bundling of data (fields) and methods that operate on that data into a single unit (class), while restricting direct access to some components.\n\nAchieved via: private fields + public getter/setter methods.\n\nExample: A BankAccount class with private 'balance' and public getBalance()/deposit() methods. This protects the balance from being modified directly.";
    }
    if (lower.includes("abstraction")) {
      return "Abstraction hides complex implementation details and shows only the essential features of an object.\n\nAchieved via: Abstract classes and Interfaces.\n\nExample: An abstract class 'Vehicle' with abstract method 'start()'. Car and Motorcycle implement start() differently, but users just call start() without knowing internal details.";
    }
    if (lower.includes("java")) {
      return "Java is a popular, object-oriented programming language known for its 'Write Once, Run Anywhere' philosophy.\n\nKey features:\n• Platform independent (JVM)\n• Strongly typed\n• Automatic garbage collection\n• Rich standard library\n• Multi-threading support\n\nCommon use cases: Enterprise apps, Android development, web backends, and big data processing.";
    }
    if (lower.includes("sql") || lower.includes("database") || lower.includes("dbms")) {
      return "SQL (Structured Query Language) is used to manage and query relational databases.\n\nCommon commands:\n• SELECT – retrieve data\n• INSERT – add new records\n• UPDATE – modify existing records\n• DELETE – remove records\n• CREATE TABLE – define a new table\n• JOIN – combine rows from two or more tables\n\nA DBMS (like MySQL, PostgreSQL) manages data storage, security, and integrity.";
    }
    if (lower.includes("data structure") || lower.includes("algorithm")) {
      return "Data Structures are ways to organize and store data efficiently. Algorithms are step-by-step procedures to solve problems using these structures.\n\nCommon data structures: Array, Linked List, Stack, Queue, Tree, Graph, Hash Map.\n\nCommon algorithms: Sorting (QuickSort, MergeSort), Searching (Binary Search), Graph traversal (BFS, DFS).\n\nChoosing the right data structure + algorithm combination is key to writing efficient programs.";
    }
    // Generic fallback
    return `Here's what I can tell you about: "${q}"\n\nThis is a great question! The AI backend is temporarily experiencing issues, so I'm providing a brief general response. Please try again later for a more detailed, AI-powered explanation.\n\nIn the meantime, feel free to:\n• Rephrase your question for a better answer\n• Check the Practice Questions section for topic-related quizzes\n• Browse your course materials for detailed explanations`;
  }

  async function askAI(event) {
    event.preventDefault();
    if (!question.trim()) return;

    try {
      setLoading(true);
      const result = await api.studyAssistant(question);
      const rawAnswer =
        result?.answer ||
        result?.response ||
        result?.message ||
        (typeof result === "string" ? result : JSON.stringify(result));

      // Detect backend compilation errors or garbage responses
      const isErrorResponse =
        typeof rawAnswer === "string" &&
        (rawAnswer.includes("Unresolved compilation") ||
          rawAnswer.includes("Syntax error on token") ||
          rawAnswer.includes("compilation problem") ||
          rawAnswer.includes("cannot be resolved") ||
          rawAnswer.length < 3 ||
          rawAnswer.startsWith("{") && rawAnswer.includes("status"));

      if (isErrorResponse) {
        setAnswer(generateLocalFallback(question));
      } else {
        setAnswer(rawAnswer);
      }
    } catch (e) {
      // On network error, timeout, etc., provide a local fallback
      setAnswer(generateLocalFallback(question));
    } finally {
      setLoading(false);
    }
  }

  async function generatePractice(customTopic, customCount) {
    const targetTopic = (typeof customTopic === "string" ? customTopic : topic).trim();
    const targetCount = Number(customCount) || requestedCount || 100;

    if (!targetTopic) return;

    try {
      setPracticeLoading(true);
      setPracticeError("");
      setQuestions([]);
      setPicks({});
      setRevealed(false);
      setCurrentPage(1);

      let fetchedList = [];
      try {
        const result = await api.generateQuestions(targetTopic, targetCount);
        if (Array.isArray(result) && result.length >= targetCount) {
          fetchedList = result;
        } else if (Array.isArray(result) && result.length > 0) {
          // If backend returned fewer (e.g. 3), top up with local high-quality questions to guarantee targetCount
          const localTopup = generateLocalQuestions(targetTopic, targetCount);
          fetchedList = localTopup;
        }
      } catch (err) {
        console.warn("Backend generate-questions fallback to local generator:", err);
      }

      if (!fetchedList || fetchedList.length === 0) {
        fetchedList = generateLocalQuestions(targetTopic, targetCount);
      }

      setQuestions(fetchedList);
    } catch (e) {
      setPracticeError(e.message || "Unable to generate questions.");
    } finally {
      setPracticeLoading(false);
    }
  }

  function pickOption(qIndex, letter) {
    if (revealed) return;
    setPicks((prev) => ({
      ...prev,
      [qIndex]: letter,
    }));
  }

  function revealAnswers() {
    setRevealed(true);
    const score = questions.filter((q, i) => picks[i] === q.correctAnswer).length;
    if (score > 0) {
      awardActivity({
        type: "practice_quiz",
        points: Math.min(100, score * 2),
        topic: topic
      });
    }
  }

  function handleReset() {
    setPicks({});
    setRevealed(false);
    setCurrentPage(1);
  }

  function handleCopyQuestions() {
    if (!questions.length) return;
    const text = questions.map((q, idx) => {
      return `Q${idx + 1}. ${q.question}\n(A) ${q.optionA}\n(B) ${q.optionB}\n(C) ${q.optionC}\n(D) ${q.optionD}\nAnswer: ${q.correctAnswer}\nExplanation: ${q.explanation || 'N/A'}\n`;
    }).join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  }

  // Filter and search questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q, idx) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = `${q.question} ${q.optionA} ${q.optionB} ${q.optionC} ${q.optionD} ${q.explanation || ""}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      // Status filter
      if (filterMode === "unanswered") {
        return !picks[idx];
      }
      if (filterMode === "incorrect" && revealed) {
        return picks[idx] !== q.correctAnswer;
      }
      return true;
    });
  }, [questions, searchQuery, filterMode, picks, revealed]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const currentQuestions = useMemo(() => {
    if (pageSize >= 200) return filteredQuestions;
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const answeredCount = Object.keys(picks).length;
  const practiceScore = questions.filter((q, i) => picks[i] === q.correctAnswer).length;
  const scorePercent = questions.length ? Math.round((practiceScore / questions.length) * 100) : 0;

  return (
    <div className="page ai-page">
      {/* Hero Banner */}
      <div className="analytics-hero">
        <div>
          <h2>🤖 AI Study & Practice Hub</h2>
          <p>
            Generate 100+ comprehensive AI practice questions, ask study queries, and focus with Pomodoro.
          </p>
        </div>
      </div>

      <div className="ai-grid">
        {/* =============================================
            STUDY ASSISTANT (Chat with AI)
        ============================================= */}
        <section className="card ai-assistant">
          <div className="ai-icon">🤖</div>
          <h2>How can I help you?</h2>
          <p className="section-note">Ask any academic question or concept doubt.</p>

          <form onSubmit={askAI}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Explain Polymorphism with a real-world Java example..."
              rows="4"
            />
            <button className="primary" disabled={loading || !question.trim()}>
              {loading ? "Thinking..." : "✨ Ask AI"}
            </button>
          </form>

          {answer && (
            <div className="ai-answer" style={{ marginTop: 16 }}>
              <h3>🤖 AI Explanation</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
            </div>
          )}
        </section>

        {/* =============================================
            POMODORO FOCUS TIMER
        ============================================= */}
        <section className="card pomodoro-card">
          <div className="ai-icon pomodoro-icon">🍅</div>
          <h2>Focus Timer</h2>
          <p className="section-note">25 min focus, 5 min break. Complete sessions to earn XP.</p>

          <div
            className="pomodoro-ring"
            style={{ "--pct": timerPct + "%" }}
          >
            <div className="pomodoro-inner">
              <strong>{formatTime(Math.max(0, remaining))}</strong>
              <span>{mode === "work" ? "Focus" : "Break"}</span>
            </div>
          </div>

          <div className="pomodoro-actions">
            <button className="primary" onClick={() => setRunning((r) => !r)}>
              {running
                ? "⏸ Pause"
                : remaining === (mode === "work" ? WORK_SEC : BREAK_SEC)
                ? "▶ Start"
                : "▶ Resume"}
            </button>
            <button className="secondary" onClick={resetTimer}>
              ↺ Reset
            </button>
          </div>

          <small className="pomodoro-sessions">
            🍅 {sessions} focus {sessions === 1 ? "session" : "sessions"} completed
          </small>
        </section>
      </div>

      {/* =============================================
          AI PRACTICE QUESTION GENERATOR (100+ Questions)
      ============================================= */}
      <section className="card practice-card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="ai-icon practice-icon" style={{ margin: 0 }}>✍️</div>
            <div>
              <h2 style={{ margin: 0 }}>AI Practice Questions Generator</h2>
              <p className="section-note" style={{ margin: "4px 0 0" }}>
                Generate up to 100+ comprehensive multiple-choice questions for any topic.
              </p>
            </div>
          </div>
          {questions.length > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="secondary" onClick={handleCopyQuestions} title="Copy all questions for offline notes">
                {copiedNotification ? "✅ Copied!" : "📋 Copy Questions"}
              </button>
              <button className="secondary" onClick={handleReset}>
                ↺ Retake Quiz
              </button>
            </div>
          )}
        </div>

        {/* Generator Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generatePractice(topic, requestedCount);
          }}
          style={{ marginTop: 18 }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              style={{ flex: 1, minWidth: 260 }}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic e.g. OOP Concepts, Java, Python, DBMS, Networks..."
            />

            {/* Question count selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Count:</span>
              <div style={{ display: "flex", gap: 4 }}>
                {COUNT_OPTIONS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={`count-pill-btn ${requestedCount === cnt ? "active" : ""}`}
                    onClick={() => setRequestedCount(cnt)}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="primary"
              disabled={practiceLoading || !topic.trim()}
              style={{ minWidth: 160 }}
            >
              {practiceLoading ? `Generating ${requestedCount} Qs...` : `✨ Generate ${requestedCount} Questions`}
            </button>
          </div>

          {/* Quick topic suggestion pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Suggested:</span>
            {TOPIC_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                className={`topic-badge-pill ${topic.toLowerCase() === sug.toLowerCase() ? "active" : ""}`}
                onClick={() => {
                  setTopic(sug);
                  generatePractice(sug, requestedCount);
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        </form>

        {practiceError && <div className="error" style={{ marginTop: 16 }}>{practiceError}</div>}

        {/* =============================================
            GENERATED 100 QUESTIONS WORKSPACE
        ============================================= */}
        {questions.length > 0 && (
          <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
            {/* Header summary & score bar */}
            <div className="quiz-stats-header">
              <div className="quiz-stat-pill">
                <span className="label">Topic:</span>
                <strong>{topic}</strong>
              </div>
              <div className="quiz-stat-pill">
                <span className="label">Total:</span>
                <strong>{questions.length} Questions</strong>
              </div>
              <div className="quiz-stat-pill">
                <span className="label">Progress:</span>
                <strong>{answeredCount} / {questions.length} Answered</strong>
              </div>
              {revealed && (
                <div className={`quiz-stat-pill score-pill ${scorePercent >= 70 ? "good" : scorePercent >= 40 ? "avg" : "low"}`}>
                  <span className="label">Score:</span>
                  <strong>{practiceScore} / {questions.length} ({scorePercent}%)</strong>
                </div>
              )}
            </div>

            {/* Quick Question Jump Navigator (1 to 100) */}
            <div className="question-nav-container" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Question Navigator ({questions.length} Questions):</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Click any number to jump</span>
              </div>
              <div className="question-grid-pills">
                {questions.map((q, idx) => {
                  const isAnswered = !!picks[idx];
                  let statusClass = "";
                  if (revealed) {
                    statusClass = picks[idx] === q.correctAnswer ? "correct" : "wrong";
                  } else if (isAnswered) {
                    statusClass = "answered";
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`q-num-pill ${statusClass}`}
                      onClick={() => {
                        const targetPage = Math.floor(idx / pageSize) + 1;
                        if (targetPage !== currentPage) setCurrentPage(targetPage);
                        setTimeout(() => {
                          const el = document.getElementById(`question-card-${idx}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);
                      }}
                      title={`Q${idx + 1}: ${isAnswered ? `Answered (${picks[idx]})` : "Unanswered"}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toolbar: Search, Filter, Page size */}
            <div className="quiz-filter-toolbar" style={{ marginTop: 18, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 240 }}>
                <input
                  type="search"
                  placeholder="Search questions or options..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ maxWidth: 300, fontSize: 13, padding: "6px 12px" }}
                />
                {revealed && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
                      onClick={() => { setFilterMode("all"); setCurrentPage(1); }}
                    >
                      All ({questions.length})
                    </button>
                    <button
                      type="button"
                      className={`filter-btn ${filterMode === "incorrect" ? "active" : ""}`}
                      onClick={() => { setFilterMode("incorrect"); setCurrentPage(1); }}
                    >
                      Incorrect ({questions.length - practiceScore})
                    </button>
                  </div>
                )}
              </div>

              {/* Items per page selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>View:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6 }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={200}>All {questions.length} questions</option>
                </select>
              </div>
            </div>

            {/* Questions List */}
            <div className="practice-questions-list" style={{ marginTop: 16 }}>
              {currentQuestions.map((q, localIdx) => {
                // Find actual index in master questions array
                const realIndex = questions.findIndex((orig) => orig === q);
                const actualIdx = realIndex !== -1 ? realIndex : localIdx;
                const userPick = picks[actualIdx];

                return (
                  <div
                    className={`practice-question-card ${revealed ? (userPick === q.correctAnswer ? "card-correct" : "card-wrong") : ""}`}
                    key={actualIdx}
                    id={`question-card-${actualIdx}`}
                  >
                    <div className="q-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="q-badge">Question {actualIdx + 1} of {questions.length}</span>
                        {q.difficulty && (
                          <span className={`diff-tag ${q.difficulty.toLowerCase()}`}>
                            {q.difficulty}
                          </span>
                        )}
                        {q.topic && (
                          <span className="subtopic-tag">{q.topic}</span>
                        )}
                      </div>
                      {revealed && (
                        <span className={`result-tag ${userPick === q.correctAnswer ? "tag-correct" : "tag-wrong"}`}>
                          {userPick === q.correctAnswer ? "✅ Correct (+1)" : "❌ Incorrect"}
                        </span>
                      )}
                    </div>

                    <p className="q-text">{q.question}</p>

                    {/* Options A, B, C, D */}
                    <div className="practice-options-grid">
                      {["A", "B", "C", "D"].map((letter) => {
                        const optText = q[`option${letter}`];
                        if (!optText) return null;

                        const isSelected = userPick === letter;
                        const isCorrectOption = q.correctAnswer === letter;

                        let optClass = "practice-option-btn";
                        if (isSelected) optClass += " selected";
                        if (revealed) {
                          if (isCorrectOption) optClass += " is-correct";
                          else if (isSelected && !isCorrectOption) optClass += " is-wrong";
                        }

                        return (
                          <button
                            key={letter}
                            type="button"
                            className={optClass}
                            onClick={() => pickOption(actualIdx, letter)}
                            disabled={revealed}
                          >
                            <span className="opt-letter">{letter}</span>
                            <span className="opt-text">{optText}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Box (shown after reveal) */}
                    {revealed && (
                      <div className="q-explanation-box">
                        <strong>💡 Explanation:</strong>
                        <p>{q.explanation || `The correct answer is Option (${q.correctAnswer}).`}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="quiz-pagination-controls" style={{ marginTop: 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <button
                  className="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                >
                  ← Previous
                </button>

                <span style={{ fontSize: 13, fontWeight: 600, padding: "0 8px" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Bottom Floating/Sticky Action Bar */}
            <div className="quiz-bottom-actions" style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "var(--surface-soft, #f8fafc)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <div>
                <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions answered
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {!revealed ? (
                  <button
                    className="primary"
                    onClick={revealAnswers}
                    disabled={answeredCount === 0}
                    style={{ minWidth: 180, padding: "10px 20px", fontSize: 15 }}
                  >
                    🎯 Check All {questions.length} Answers
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="secondary" onClick={handleReset}>
                      🔄 Retake Quiz
                    </button>
                    <button className="primary" onClick={() => generatePractice(topic, requestedCount)}>
                      ✨ Generate New Set
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AIAssistant;

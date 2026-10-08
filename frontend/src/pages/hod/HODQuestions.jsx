import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { Pencil, PlusCircle, Bot, Trash2, ChevronLeft } from "lucide-react";

export default function HODQuestions() {
  const { id } = useParams();
  const location = useLocation();

  // `questions/new` is declared as a LITERAL route (not `questions/:id`),
  // so useParams() is empty there - match on the pathname instead.
  if (location.pathname.endsWith("/new")) return <QuestionForm />;
  if (id) return <QuestionForm questionId={id} />;
  return <QuestionList />;
}

// =====================================================
// LIST VIEW
// =====================================================

function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // AI generation dialog
  const [showGen, setShowGen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [gen, setGen] = useState({ topic: "", count: 10, quizId: "" });

  useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodQuestions().catch(() => []);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load questions.");
    } finally {
      setLoading(false);
    }
  }

  async function openGenerate() {
    setError("");
    setShowGen(true);
    if (quizzes.length === 0) {
      try {
        const data = await api.quizzes().catch(() => []);
        const list = Array.isArray(data) ? data : [];
        setQuizzes(list);
        setGen((g) => ({ ...g, quizId: g.quizId || (list[0]?.id ? String(list[0].id) : "") }));
      } catch {
        setQuizzes([]);
      }
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();

    if (!gen.quizId) {
      setError("Pick the quiz the generated questions should be added to.");
      return;
    }

    const count = Math.min(Math.max(Number(gen.count) || 10, 1), 50);
    const quizName =
      quizzes.find((q) => String(q.id) === String(gen.quizId))?.title ||
      quizzes.find((q) => String(q.id) === String(gen.quizId))?.name ||
      "quiz";

    try {
      setGenerating(true);
      setError("");

      const saved = await api.hodGenerateQuestions({
        topic: gen.topic.trim() || "General",
        count,
        quizId: Number(gen.quizId),
      });

      setShowGen(false);
      await loadQuestions();
      setNotice(
        `Generated ${Array.isArray(saved) ? saved.length : count} AI questions into "${quizName}".`
      );
    } catch (err) {
      setError(err.message || "AI question generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(q) {
    const label = q.title || q.question || "this question";
    const ok = window.confirm(`Delete "${label}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      await api.deleteQuestion(q.id);
      await loadQuestions();
    } catch (err) {
      setError(err.message || "Failed to delete question.");
    }
  }

  return (
    <div className="page hod-questions">
      <div className="page-heading">
        <h1>Question Bank</h1>
        <p>Manage questions: create, edit, and generate AI questions.</p>
      </div>

      <div className="hod-actions">
        <button className="inst-btn inst-btn-primary" onClick={openGenerate}>
          <Bot size={16} /> Generate AI Questions
        </button>
        <Link to="/hod/questions/new" className="inst-btn inst-btn-secondary">
          <PlusCircle size={16} /> Add Question
        </Link>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {loading ? (
        <div className="inst-loading">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>Question bank is empty</h3>
          <p>Add questions manually or use AI to generate them.</p>
          <button className="inst-btn primary" onClick={openGenerate}>
            <Bot size={16} /> Generate with AI
          </button>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Type</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.title || q.question || "Untitled"}</td>
                  <td>
                    <span className="status-badge">{q.type || "MCQ"}</span>
                  </td>
                  <td>
                    {q.category ? <span className="hod-sub">{q.category}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    <span className={`status-badge status-${q.difficulty?.toLowerCase() || "medium"}`}>
                      {q.difficulty || "Medium"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${q.status?.toLowerCase() || "active"}`}>
                      {q.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="hod-actions-cell">
                      <Link to={`/hod/questions/${q.id}`} className="inst-btn inst-btn-small">
                        <Pencil size={14} /> Edit
                      </Link>
                      <button
                        className="inst-btn inst-btn-small danger"
                        onClick={() => handleDelete(q)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate AI questions dialog */}
      {showGen && (
        <div
          className="inst-modal-overlay"
          onClick={() => !generating && setShowGen(false)}
        >
          <div className="inst-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Generate AI Questions</h2>
            <p>
              Questions are generated instantly and saved into the quiz you
              pick, so they show up in the bank right away.
            </p>

            <form onSubmit={handleGenerate}>
              <div className="inst-form-group" style={{ marginTop: 14 }}>
                <label>Add to quiz *</label>
                <select
                  className="inst-select"
                  value={gen.quizId}
                  onChange={(e) => setGen((g) => ({ ...g, quizId: e.target.value }))}
                  required
                >
                  <option value="">Select a quiz...</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title || q.name || `Quiz #${q.id}`}
                    </option>
                  ))}
                </select>
                {quizzes.length === 0 && (
                  <span className="hod-sub">
                    No quizzes found - create a quiz first, then generate into it.
                  </span>
                )}
              </div>

              <div className="inst-form-group">
                <label>Topic</label>
                <input
                  className="inst-input"
                  placeholder="e.g. Object Oriented Programming"
                  value={gen.topic}
                  onChange={(e) => setGen((g) => ({ ...g, topic: e.target.value }))}
                />
              </div>

              <div className="inst-form-group">
                <label>How many questions?</label>
                <input
                  className="inst-input"
                  type="number"
                  min="1"
                  max="50"
                  value={gen.count}
                  onChange={(e) => setGen((g) => ({ ...g, count: e.target.value }))}
                />
              </div>

              <div className="inst-modal-actions">
                <button
                  type="button"
                  className="inst-btn inst-btn-secondary"
                  onClick={() => setShowGen(false)}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inst-btn inst-btn-primary"
                  disabled={generating}
                >
                  <Bot size={15} /> {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ADD / EDIT FORM (routes: /hod/questions/new, /hod/questions/:id)
// =====================================================

const EMPTY_FORM = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  marks: 1,
  questionOrder: 1,
  quizId: "",
};

function QuestionForm({ questionId }) {
  const navigate = useNavigate();
  const isEdit = Boolean(questionId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) loadQuestion();
    else loadQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  async function loadQuestion() {
    try {
      setLoading(true);
      setError("");
      const q = await api.getQuestion(questionId);
      setForm({
        questionText: q.questionText || "",
        optionA: q.optionA || "",
        optionB: q.optionB || "",
        optionC: q.optionC || "",
        optionD: q.optionD || "",
        correctAnswer: q.correctAnswer || "A",
        marks: q.marks ?? 1,
        questionOrder: q.questionOrder ?? 1,
        quizId: "",
      });
    } catch (e) {
      setError(e.message || "Unable to load question.");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuizzes() {
    try {
      const data = await api.quizzes().catch(() => []);
      setQuizzes(Array.isArray(data) ? data : []);
    } catch {
      setQuizzes([]);
    }
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.questionText.trim()) {
      setError("Question text is required.");
      return;
    }
    if (!form.optionA.trim() || !form.optionB.trim()) {
      setError("At least options A and B are required.");
      return;
    }
    if (!isEdit && !form.quizId) {
      setError("Pick the quiz this question belongs to.");
      return;
    }

    const body = {
      questionText: form.questionText.trim(),
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
      optionC: form.optionC.trim() || "-",
      optionD: form.optionD.trim() || "-",
      correctAnswer: form.correctAnswer,
      marks: Number(form.marks) || 1,
      questionOrder: Number(form.questionOrder) || 1,
    };

    try {
      setSaving(true);
      setError("");

      if (isEdit) {
        await api.updateQuestion(questionId, body);
      } else {
        await api.createQuestion(form.quizId, body);
      }

      navigate("/hod/questions");
    } catch (err) {
      setError(err.message || (isEdit ? "Failed to update question." : "Failed to create question."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page hod-questions">
        <div className="inst-loading">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="page hod-questions">
      <div className="page-heading">
        <button className="back-link" onClick={() => navigate("/hod/questions")}>
          <ChevronLeft size={14} /> Back to Question Bank
        </button>
        <h1>{isEdit ? "Edit Question" : "Add Question"}</h1>
        <p>
          {isEdit
            ? "Update the question text, options, or correct answer."
            : "Create a multiple-choice question for one of your quizzes."}
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <form className="inst-form" onSubmit={handleSubmit}>
          {!isEdit && (
            <div className="inst-form-group">
              <label>Quiz *</label>
              <select
                className="inst-select"
                value={form.quizId}
                onChange={(e) => setField("quizId", e.target.value)}
                required
              >
                <option value="">Select a quiz...</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title || quiz.name || `Quiz #${quiz.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="inst-form-group">
            <label>Question *</label>
            <textarea
              className="inst-textarea"
              value={form.questionText}
              onChange={(e) => setField("questionText", e.target.value)}
              placeholder="e.g. Which of the following best describes polymorphism?"
              rows={3}
              required
            />
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Option A *</label>
              <input
                className="inst-input"
                value={form.optionA}
                onChange={(e) => setField("optionA", e.target.value)}
                required
              />
            </div>
            <div className="inst-form-group">
              <label>Option B *</label>
              <input
                className="inst-input"
                value={form.optionB}
                onChange={(e) => setField("optionB", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Option C</label>
              <input
                className="inst-input"
                value={form.optionC}
                onChange={(e) => setField("optionC", e.target.value)}
              />
            </div>
            <div className="inst-form-group">
              <label>Option D</label>
              <input
                className="inst-input"
                value={form.optionD}
                onChange={(e) => setField("optionD", e.target.value)}
              />
            </div>
          </div>

          <div className="inst-form-row">
            <div className="inst-form-group">
              <label>Correct Answer *</label>
              <select
                className="inst-select"
                value={form.correctAnswer}
                onChange={(e) => setField("correctAnswer", e.target.value)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="inst-form-group">
              <label>Marks</label>
              <input
                className="inst-input"
                type="number"
                min={1}
                value={form.marks}
                onChange={(e) => setField("marks", e.target.value)}
              />
            </div>
          </div>

          <div className="inst-form-group">
            <label>Question Order</label>
            <input
              className="inst-input"
              type="number"
              min={1}
              value={form.questionOrder}
              onChange={(e) => setField("questionOrder", e.target.value)}
            />
          </div>

          <div className="inst-modal-actions">
            <button
              type="button"
              className="inst-btn inst-btn-secondary"
              onClick={() => navigate("/hod/questions")}
            >
              Cancel
            </button>
            <button type="submit" className="inst-btn inst-btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

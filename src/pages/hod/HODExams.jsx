import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import {
  FileQuestion, PlusCircle, GraduationCap, Trash2, ChevronLeft, Save
} from "lucide-react";

/**
 * HOD - Exams
 *
 * Routes (all rendered by this file):
 *   /hod/exams        -> list
 *   /hod/exams/new    -> create form
 *   /hod/exams/:id    -> manage one exam (details + question paper + delete)
 *
 * Previously the create/manage routes pointed at the list component, so the
 * "Create Exam" and "Manage" buttons only changed the URL while the screen
 * stayed exactly the same.
 */
export default function HODExams() {
  const { id } = useParams();
  const location = useLocation();

  // NOTE: the app declares `exams/new` as a LITERAL route (not `exams/:id`),
  // so useParams() is empty for the create page - match on the pathname.
  if (location.pathname.endsWith("/new")) return <ExamCreate />;
  if (id) return <ExamManage examId={id} />;
  return <ExamList />;
}

// =====================================================
// LIST VIEW
// =====================================================

function ExamList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");

  useEffect(() => { loadExams(); }, []);

  // The notice is passed in via navigation state (create/delete from the
  // other views). Clear it from history so it doesn't reappear on refresh.
  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadExams() {
    try {
      setLoading(true);
      setError("");
      const data = await api.hodExams().catch(() => []);
      setExams(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(exam) {
    const name = exam.title || exam.name || "this exam";
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      await api.deleteExam(exam.id);
      await loadExams();
      setNotice(`Deleted "${name}".`);
    } catch (err) {
      setError(err.message || "Failed to delete exam.");
    }
  }

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <h1>Exams</h1>
        <p>Create exams, manage question papers, and track exam performance.</p>
      </div>

      <div className="hod-actions">
        <Link to="/hod/exams/new" className="inst-btn inst-btn-primary">
          <PlusCircle size={16} /> Create Exam
        </Link>
        <Link to="/hod/questions" className="inst-btn inst-btn-secondary">
          <FileQuestion size={16} /> Manage Questions
        </Link>
        <button className="inst-btn inst-btn-secondary" onClick={loadExams}>Refresh</button>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {loading ? (
        <div className="inst-loading">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>No exams yet</h3>
          <p>Create your first exam to start managing question papers.</p>
          <Link to="/hod/exams/new" className="inst-btn primary">
            <PlusCircle size={16} /> Create Exam
          </Link>
        </div>
      ) : (
        <div className="hod-table-wrap">
          <table className="hod-table">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Questions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title || e.name}</strong>
                    {e.description && <span className="hod-sub">{e.description}</span>}
                  </td>
                  <td>
                    {e.courseName ? <span className="hod-sub">{e.courseName}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    {e.date ? <span className="hod-sub">{new Date(e.date).toLocaleDateString()}</span> : <span className="hod-sub">—</span>}
                  </td>
                  <td>
                    <span className="hod-sub">{e.duration} mins</span>
                  </td>
                  <td>
                    <span className="hod-sub">{e.questionCount || 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${e.status?.toLowerCase() || "active"}`}>
                      {e.status || "Active"}
                    </span>
                  </td>
                  <td className="hod-actions-cell">
                    <div className="hod-actions-cell">
                      <Link to={`/hod/exams/${e.id}`} className="inst-btn inst-btn-small">
                        <GraduationCap size={14} /> Manage
                      </Link>
                      <button
                        className="inst-btn inst-btn-small danger"
                        onClick={() => handleDelete(e)}
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
    </div>
  );
}

// =====================================================
// CREATE VIEW (route: /hod/exams/new)
// =====================================================

const EMPTY_EXAM = {
  title: "",
  courseId: "",
  durationMinutes: 60,
  totalMarks: 100,
  passingMarks: 40,
  startTime: "",
  status: "SCHEDULED",
  description: "",
};

function ExamCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_EXAM);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.hodCourses()
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }, []);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError("Exam name is required.");
      return;
    }
    if (!form.courseId) {
      setError("Pick the course this exam belongs to.");
      return;
    }

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      durationMinutes: Number(form.durationMinutes) || 60,
      totalMarks: Number(form.totalMarks) || 100,
      passingMarks: Number(form.passingMarks) || 40,
      status: form.status,
      startTime: form.startTime ? form.startTime : null,
      course: { id: Number(form.courseId) },
    };

    try {
      setSaving(true);
      setError("");
      const created = await api.instructorCreateExam(body);
      navigate("/hod/exams", {
        state: { notice: `Exam "${body.title}" created.` },
      });
      return created;
    } catch (err) {
      setError(err.message || "Failed to create exam.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <button className="back-link" onClick={() => navigate("/hod/exams")}>
          <ChevronLeft size={14} /> Back to Exams
        </button>
        <h1>Create Exam</h1>
        <p>Schedule a new exam and attach it to one of your courses.</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <form className="inst-form" onSubmit={handleSubmit}>
          <div className="inst-form-group">
            <label>Exam name *</label>
            <input
              className="inst-input"
              placeholder="e.g. Mid Semester Exam"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          <div className="inst-form-group">
            <label>Course *</label>
            <select
              className="inst-select"
              value={form.courseId}
              onChange={(e) => setField("courseId", e.target.value)}
              required
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.courseName || `Course ${c.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="inst-form-row" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>Duration (minutes)</label>
              <input
                className="inst-input"
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={(e) => setField("durationMinutes", e.target.value)}
              />
            </div>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>Total marks</label>
              <input
                className="inst-input"
                type="number"
                min="1"
                value={form.totalMarks}
                onChange={(e) => setField("totalMarks", e.target.value)}
              />
            </div>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 150 }}>
              <label>Passing marks</label>
              <input
                className="inst-input"
                type="number"
                min="0"
                value={form.passingMarks}
                onChange={(e) => setField("passingMarks", e.target.value)}
              />
            </div>
          </div>

          <div className="inst-form-row" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 180 }}>
              <label>Starts at</label>
              <input
                className="inst-input"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setField("startTime", e.target.value)}
              />
            </div>
            <div className="inst-form-group" style={{ flex: 1, minWidth: 180 }}>
              <label>Status</label>
              <select
                className="inst-select"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="inst-form-group">
            <label>Description</label>
            <textarea
              className="inst-input"
              placeholder="Short description shown in the exam list..."
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="inst-modal-actions">
            <button
              type="button"
              className="inst-btn inst-btn-secondary"
              onClick={() => navigate("/hod/exams")}
            >
              Cancel
            </button>
            <button type="submit" className="inst-btn inst-btn-primary" disabled={saving}>
              <PlusCircle size={15} /> {saving ? "Creating..." : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// MANAGE VIEW (route: /hod/exams/:id)
// =====================================================

function ExamManage({ examId }) {
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [meta, setMeta] = useState(null); // row from /hod/exams (course name etc.)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => { load(); }, [examId]);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [examData, list] = await Promise.all([
        api.exam(examId),
        api.hodExams().catch(() => []),
      ]);

      setExam(examData);
      setStatus(examData?.status || "SCHEDULED");
      setMeta(
        (Array.isArray(list) ? list : []).find(
          (e) => Number(e.id) === Number(examId)
        ) || null
      );
    } catch (e) {
      setError(e.message || "Unable to load this exam.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusSave() {
    if (!exam) return;
    try {
      setSaving(true);
      setError("");
      // updateExam replaces every field it reads, so send the exam back as-is
      // with only the status changed.
      await api.updateExam(exam.id, { ...exam, status });
      await load();
    } catch (err) {
      setError(err.message || "Failed to update the exam.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!exam) return;
    const name = exam.title || "this exam";
    const ok = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      await api.deleteExam(exam.id);
      navigate("/hod/exams", {
        state: { notice: `Deleted "${name}".` },
      });
    } catch (err) {
      setError(err.message || "Failed to delete exam.");
    }
  }

  const paper = parsePaper(exam?.questionPaper);

  return (
    <div className="page hod-exams">
      <div className="page-heading">
        <button className="back-link" onClick={() => navigate("/hod/exams")}>
          <ChevronLeft size={14} /> Back to Exams
        </button>
        <h1>{loading ? "Exam" : exam?.title || "Exam"}</h1>
        <p>
          {meta?.courseName || "Course details unavailable"} · {exam?.durationMinutes ?? "—"} mins
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="inst-loading">Loading exam...</div>
      ) : !exam ? (
        <div className="card hod-empty">
          <div className="empty-icon">📝</div>
          <h3>Exam not found</h3>
          <p>It may have been deleted.</p>
          <Link to="/hod/exams" className="inst-btn primary">Back to Exams</Link>
        </div>
      ) : (
        <>
          {/* Summary + actions */}
          <div className="card">
            <div className="hod-actions" style={{ marginTop: 0 }}>
              <span className={`status-badge status-${(exam.status || "scheduled").toLowerCase()}`}>
                {exam.status || "SCHEDULED"}
              </span>
              <span className="hod-sub" style={{ marginTop: 0 }}>
                {meta?.questionCount ?? (paper?.totalQuestions ?? 0)} questions · {exam.totalMarks} marks
                (pass {exam.passingMarks}) · {exam.durationMinutes} mins
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                <select
                  className="inst-select"
                  style={{ width: 170 }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <button
                  className="inst-btn inst-btn-small inst-btn-primary"
                  onClick={handleStatusSave}
                  disabled={saving || status === exam.status}
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="inst-btn inst-btn-small inst-btn-danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {exam.description && <p className="hod-sub">{exam.description}</p>}
            {exam.startTime && (
              <p className="hod-sub">Starts {new Date(exam.startTime).toLocaleString()}</p>
            )}
          </div>

          {/* Question paper */}
          <div className="page-heading" style={{ marginTop: 26, marginBottom: 12 }}>
            <h1 style={{ fontSize: 20 }}>Question Paper</h1>
            <p>
              {paper
                ? `${paper.title || exam.title} — ${paper.totalQuestions ?? paper.questionCount ?? questionsOf(paper).length} questions, difficulty ${paper.difficulty || "—"}`
                : "No question paper has been uploaded for this exam yet."}
            </p>
          </div>

          {!paper ? (
            <div className="card hod-empty">
              <div className="empty-icon">📄</div>
              <h3>No question paper yet</h3>
              <p>Generate a paper from AI Tools, then upload it to this exam.</p>
              <Link to="/hod/questions" className="inst-btn primary">
                <FileQuestion size={15} /> Manage Questions
              </Link>
            </div>
          ) : (
            <div className="hod-table-wrap">
              <table className="hod-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Marks</th>
                    <th>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsOf(paper).map((q, i) => (
                    <tr key={q.num ?? i}>
                      <td><span className="hod-sub">{q.num ?? i + 1}</span></td>
                      <td><strong>{q.text || q.question || "—"}</strong></td>
                      <td><span className="hod-sub">{q.marks ?? 1}</span></td>
                      <td><span className="status-badge status-active">{q.answer || "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---- question paper helpers -------------------------------------------

/** Parse the AI-generated question paper JSON, tolerating bad payloads. */
function parsePaper(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Flatten every section of a paper into one question list. */
function questionsOf(paper) {
  if (!paper) return [];
  if (Array.isArray(paper.questions)) return paper.questions;
  if (!Array.isArray(paper.sections)) return [];
  return paper.sections.flatMap((s) =>
    Array.isArray(s?.questions)
      ? s.questions.map((q) => ({ ...q, marks: q.marks ?? s.marksPerQuestion }))
      : []
  );
}
